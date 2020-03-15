import { DimensionSelection, Dimension } from './types';

export function normalizeChannelSelection(
  dimensions: Dimension[],
  dimSelections: DimensionSelection[],
): number[] {
  const channelSelection: number[] = Array(dimensions.length).fill(0);
  const dimNames = dimensions.map(d => d.name);
  for (const { id, index } of dimSelections) {
    const normedId = typeof id === 'string' ? dimNames.indexOf(id) : id;

    if (normedId < 0) {
      throw Error(`Dimension '${id}' does not exist on array with dimensions : ${dimNames}`);
    }

    const { name, type, values } = dimensions[normedId];
    let normedIndex: number;
    if (typeof index === 'string') {
      if (!(type === 'nominal' || type === 'ordinal')) {
        throw Error(`Label '${index}' does not exist on dimension '${name}' with type '${type}'.`);
      } else if (!values) {
        throw Error(
          `Dimension '${name}' with type '${type}' does not contain labeled indicies.
          Please provide values or index dimension using an integer.`,
        );
      } else {
        // index provided is a string and labels exist
        normedIndex = (values as string[]).indexOf(index);
      }
    } else {
      // index provided is a number
      normedIndex = index;
    }

    if (normedIndex < 0) {
      throw Error(`Dimension ${name} does not contain index ${index}.`);
    }

    channelSelection[normedId] = normedIndex;
  }
  return channelSelection;
}

export function guessRgb(shape: number[]): boolean {
  const lastDimSize = shape[shape.length - 1];
  return shape.length > 2 && lastDimSize < 5 ? true : false;
}

export function range(len: number): number[] {
  return [...Array(len).keys()];
}
