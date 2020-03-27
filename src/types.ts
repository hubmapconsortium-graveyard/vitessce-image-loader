import { TypedArray } from 'zarr';
import { DtypeString } from 'zarr/dist/types/types';

export abstract class ImageLoader {
  abstract type: string;
  abstract isPyramid: boolean;
  abstract isRgb: boolean;
  abstract scale: number;
  abstract translate: number[];
  abstract dtype: DtypeString;
  abstract tileSize: number;
  abstract numLevels: number;
  abstract getTile({ x, y, z }: TileIndex): Promise<TileData> | TileData;
  abstract getRaster({ z }: RasterIndex): Promise<RasterData> | RasterData;
  abstract onTileError(err: Error): void;
}

export type TileData = TypedArray[];

export interface RasterData {
  data: TileData;
  width: number;
  height: number;
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
