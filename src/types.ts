import { TypedArray } from 'zarr';

export abstract class ImageLoader {
  abstract type: string;
  abstract vivMetadata: VivMetadata;
  abstract isPyramid: boolean;
  abstract isRgb: boolean;
  abstract scale: number;
  abstract translate: number[];
  abstract getTile({ x, y, z }: TileIndex): Promise<TypedArray[]> | TypedArray[];
  abstract getRaster({ z }: RasterIndex): Promise<TypedArray[]> | TypedArray[];
}

export interface TileIndex {
  x: number;
  y: number;
  z?: number;
}

export interface RasterIndex {
  z?: number;
}

interface LengthUnit {
  size: number;
  unit: string;
}

type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';

type ValidDimensionUnit = LengthUnit | TimeUnit;

type ValidDimensionType = 'quantitative' | 'ordinal' | 'nominal' | 'temporal';

export interface Dimension {
  name: string;
  type: ValidDimensionType;
  unit?: ValidDimensionUnit;
  values?: string[] | number[] | TypedArray;
}
export interface DimensionSelection {
  id: string | number;
  index: string | number;
}

export interface VivMetadata {
  imageWidth: number;
  imageHeight: number;
  tileSize: number;
  minZoom: number;
  dtype: string;
  scale: number;
  translate: number[];
}
