import { zeros, NestedArray, ZarrArray } from 'zarr';

import ZarrLoader from '../src/zarrLoader';

describe('2D image, non-rgb', () => {
  let z: ZarrArray;
  beforeAll(async () => {
    z = await zeros([2, 500, 250], {
      chunks: [1, 100, 100],
      dtype: '<i4',
    });
    await z.set([0, null, null], 42);
    await z.set([1, 0, null], NestedArray.arange(250));
  });

  test('Check basic unlabeled loader', async () => {
    const loader = new ZarrLoader(z);
    expect(loader.dimensions).toBe(undefined);
    const {
      minZoom,
      dtype,
      scale,
      translate,
      tileSize,
      imageHeight,
      imageWidth,
    } = loader.vivMetadata;
    expect(minZoom).toEqual(0);
    expect(dtype).toEqual('<i4');
    expect(scale).toEqual(1);
    expect(translate).toEqual([0, 0]);
    expect(tileSize).toEqual(100);
    expect(imageHeight).toEqual(500);
    expect(imageWidth).toEqual(250);

    // Basic tile indexing
    const [tile] = await loader.getTile({ x: 0, y: 0 });
    expect(tile[10]).toEqual(42);
    expect(tile.length).toEqual(10000);

    // Basic raster index
    const [raster] = await loader.getRaster();
    expect(raster.length).toEqual(125000);
    expect(raster).toEqual(new Int32Array(125000).fill(42));

    // Get multiple Tiles
    const selections = [
      [0, 0, 0],
      [1, 0, 0],
    ];
    loader.setChannelSelections(selections);
    const tiles = await loader.getTile({ x: 0, y: 0 });
    expect(tiles.length).toEqual(2);
    expect(loader.channelSelections).toStrictEqual(selections);

    loader.setChannelSelections([1, 0, 0]);
    expect(loader.channelSelections).toStrictEqual([[1, 0, 0]]);

    // Throw errors for invalid selections
    expect(() => loader.setChannelSelections([{ id: 'x', index: 0 }])).toThrow();
    expect(() => loader.setChannelSelections([0, 0, 0, 0, 0])).toThrow();
    expect(() =>
      loader.setChannelSelections([
        [0, 0, 0],
        [1, 2, 3, 4, 5],
      ]),
    ).toThrow();
  });

  test('Invalid loader dimensions', async () => {
    expect(
      () =>
        new ZarrLoader(z, [
          { name: 'channel', type: 'nominal', values: ['A', 'B'] },
          { name: 'z', type: 'quantitative', unit: { size: 10, unit: 'micron' } },
          { name: 'y', type: 'quantitative', unit: { size: 1, unit: 'micron' } },
          { name: 'x', type: 'quantitative', unit: { size: 1, unit: 'micron' } },
        ]),
    ).toThrow();
  });

  test('Set defined loader dimensions', async () => {
    const loader = new ZarrLoader(z, [
      { name: 'channel', type: 'nominal', values: ['A', 'B'] },
      { name: 'y', type: 'quantitative', unit: { size: 1, unit: 'micron' } },
      { name: 'x', type: 'quantitative', unit: { size: 1, unit: 'micron' } },
    ]);

    loader.setChannelSelections([[{ id: 'channel', index: 'A' }], [{ id: 'channel', index: 1 }]]);
    const tiles = await loader.getTile({ x: 0, y: 0 });
    expect(tiles.length).toEqual(2);
    expect(loader.channelSelections).toStrictEqual([
      [0, 0, 0],
      [1, 0, 0],
    ]);
  });
});

describe('Image pyramid, non-rgb', () => {
  let z0: ZarrArray, z1: ZarrArray, z2: ZarrArray;
  beforeAll(async () => {
    z0 = await zeros([4, 100, 150], {
      chunks: [1, 10, 10],
      dtype: '<i4',
    });
    await z0.set(null, 0);

    z1 = await zeros([4, 50, 75], {
      chunks: [1, 10, 10],
      dtype: '<i4',
    });
    await z1.set(null, 1);

    z2 = await zeros([4, 25, 38], {
      chunks: [1, 10, 10],
      dtype: '<i4',
    });
    await z2.set(null, 2);
  });

  test('Basic pyramid indexing', async () => {
    const loader = new ZarrLoader([z0, z1, z2]);
    const singleLayerRequests = [0, 1, 2].map(z => {
      return loader.getTile({ x: 0, y: 0, z: z });
    });
    const singleLayers = await Promise.all(singleLayerRequests);
    expect(singleLayers.map(l => l.length)).toStrictEqual([1, 1, 1]);

    loader.setChannelSelections([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    const multiLayerRequests = [0, 1, 2].map(z => {
      return loader.getTile({ x: 0, y: 0, z: z });
    });
    const multiLayers = await Promise.all(multiLayerRequests);
    expect(multiLayers.map(l => l.length)).toStrictEqual([4, 4, 4]);
  });
});

describe('2D image Rgb', () => {
  let z: ZarrArray;
  beforeAll(async () => {
    z = await zeros([2, 500, 250, 4], {
      chunks: [1, 100, 100, 4],
      dtype: '<i4',
    });
    await z.set(null, 42);
  });

  test('Test Rgb tile', async () => {
    const loader = new ZarrLoader(z);
    const [tile] = await loader.getTile({ x: 0, y: 0 });
    expect(tile.length).toEqual(40000);

    const [raster] = await loader.getRaster({});
    expect(raster.length).toEqual(500000);
  });

  test('Throw if setting multiple channels on RGB', async () => {
    const loader = new ZarrLoader(z);
    const selection = [
      [0, 0, 0, 0],
      [1, 0, 0, 0],
    ];
    expect(() => loader.setChannelSelections(selection)).toThrow();
  });
});
