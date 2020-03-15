import { ZarrArray, TypedArray } from 'zarr';
import { RawArray } from 'zarr/dist/types/rawArray';
import {
  Dimension,
  ImageLoader,
  VivMetadata,
  TileIndex,
  RasterIndex,
  DimensionSelection,
} from './types';
import { guessRgb, normalizeChannelSelection } from './utils';

export default class ZarrLoader implements ImageLoader {
  public type: string;
  public isRgb: boolean;
  public scale: number;
  public translate: number[];
  public dimensions?: Dimension[];

  private _xIndex: number;
  private _yIndex: number;
  private _data: ZarrArray | ZarrArray[];
  private _channelSelections: number[][];

  constructor(
    data: ZarrArray | ZarrArray[],
    dimensions?: Dimension[],
    isRgb?: boolean,
    scale = 1,
    translate = [0, 0],
  ) {
    let base;
    if (Array.isArray(data)) {
      [base] = data;
    } else {
      base = data;
    }
    // Public attributes
    this.type = 'zarr';
    this.scale = scale;
    this.translate = translate;
    this.isRgb = isRgb ? isRgb : guessRgb(base.shape);
    if (dimensions && dimensions.length !== base.shape.length) {
      // If provided, make sure that number of labeled dims corresponds to number of arr dims
      throw Error(
        `Dimension labels ${JSON.stringify(dimensions)} does not match image with shape ${
          base.shape
        }`,
      );
    }
    this.dimensions = dimensions;

    // Private attributes
    this._data = data;
    if (isRgb) {
      this._xIndex = base.shape.length - 2;
      this._yIndex = base.shape.length - 3;
    } else {
      this._xIndex = base.shape.length - 1;
      this._yIndex = base.shape.length - 2;
    }
    this._channelSelections = [Array(base.shape.length).fill(0)];
  }

  public get isPyramid(): boolean {
    return Array.isArray(this._data);
  }

  public get base(): ZarrArray {
    return this.isPyramid ? (this._data as ZarrArray[])[0] : (this._data as ZarrArray);
  }

  public get channelSelections(): number[][] {
    return this._channelSelections;
  }

  public get vivMetadata(): VivMetadata {
    const base = this.base;
    const { dtype } = base;
    const imageHeight = base.shape[this._yIndex];
    const imageWidth = base.shape[this._xIndex];
    const tileSize = base.chunks[this._xIndex];
    const minZoom = this.isPyramid ? -this._data.length : 0;
    return {
      imageWidth,
      imageHeight,
      tileSize,
      minZoom,
      dtype,
      scale: this.scale,
      translate: this.translate,
    };
  }

  public async getTile({ x, y, z }: TileIndex): Promise<TypedArray[]> {
    const source = this._getSource(z);
    const dataRequests = this._channelSelections.map(async chunkKey => {
      chunkKey[this._yIndex] = y;
      chunkKey[this._xIndex] = x;
      const { data } = await source.getRawChunk(chunkKey);
      return data;
    });
    const data = await Promise.all(dataRequests);
    return data;
  }

  public async getRaster({ z }: RasterIndex): Promise<TypedArray[]> {
    const source = this._getSource(z);
    const dataRequests = this._channelSelections.map(async (chunkKey: (number | null)[]) => {
      chunkKey[this._yIndex] = null;
      chunkKey[this._xIndex] = null;
      const { data } = (await source.getRaw(chunkKey)) as RawArray;
      return data;
    });
    const data = await Promise.all(dataRequests);
    return data;
  }

  public setChannelSelections(
    channelSelections: (DimensionSelection | number)[][] | (DimensionSelection | number)[],
  ): void {
    // Wrap channel selection in array if only one is provided
    channelSelections = (Array.isArray(channelSelections[0])
      ? channelSelections
      : [channelSelections]) as (DimensionSelection | number)[][];

    const nextChannelSelections: number[][] = channelSelections.map(sel => {
      if (!this.dimensions) {
        const isDirectSelection = sel.every(d => typeof d === 'number');
        if (isDirectSelection) {
          return sel as number[];
        } else {
          throw Error(
            `Cannot used named selection '${sel}' to index image with specified dimensions.`,
          );
        }
      }
      return normalizeChannelSelection(this.dimensions, sel as DimensionSelection[]);
    });

    if (this.isRgb && nextChannelSelections.length > 1) {
      throw Error('Cannot specify multiple channel selections for RGB/A image.');
    }

    const allCorrectSize = nextChannelSelections.every(
      sel => sel.length === this.base.shape.length,
    );
    if (!allCorrectSize) {
      throw Error(
        `Normalized selections ${JSON.stringify(
          nextChannelSelections,
        )} do not correspond to image with shape ${this.base.shape}`,
      );
    }

    this._channelSelections = nextChannelSelections;
  }

  private _getSource(z?: number): ZarrArray {
    return z && this.isPyramid ? (this._data as ZarrArray[])[z] : (this._data as ZarrArray);
  }
}
