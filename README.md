# vitessce-image-loader

![Build Status](https://github.com/hubmapconsortium/vitessce-image-loader/workflows/build-test/badge.svg?branch=master)
![Top Language Badge](https://img.shields.io/github/languages/top/hubmapconsortium/vitessce-image-loader)

Utilities for loading single & multichannel zarr and tiff images

## Installation 

```bash
$ npm install @hubmap/vitessce-image-loader
```

## Usage
### zarr

#### Non-pyramidal images
```javascript
import { openArray } from 'zarr';
import { ZarrLoader } from '@hubmap/vitessce-image-loader';

const imageDimensions = [
  { name: 'time', type: 'temporal', unit: 'hour' },
  { name: 'stain', type: 'nominal', values: ['A', 'B', 'C', 'D'] },
  { name: 'y', type: 'quantitative', unit: { size: 1, unit: 'micron' } },
  { name: 'x', type: 'quantitative', unit: { size: 1, unit: 'micron' } },
];

(async () => {
    const z = await openArray({ store: 'http://localhost:8000/myImage.zarr' });
    console.log(z.shape);
    // [2, 4, 1000, 2000]
    console.log(z.chunkShape);
    // [1, 1, 200, 200]
    
    // Create loader
    const loader = new ZarrLoader(z, imageDimensions);
    
    // Define which images to return
    loader.setChannelSelections([
        [{ id: "time", index: 0 }, { id: "stain", index: "A" }],
        [{ id: "time", index: 0 }, { id: "stain", index: "C" }],
    ]);
    
    const tiles = await loader.getTile({ x: 0, y: 0 });
    console.log(tiles.length, tiles[0].length);
    // 2, 4000
    
    const rasters = await loader.getRaster();
    console.log(rasters.length, rasters[0].length);
    // 2, 2000000
})();
```

#### Tiled pyramidal images
```javascript
(async () => {
    const pyramid = await Promise.all([0, 1, 2, 3].map(d => {
        return openArray({ store: `http://localhost:8000/pyramid/${d}` });
    }));
    
    // Create loader
    const loader = new ZarrLoader(pyramid, imageDimensions);
    
    // Define which images to return
    loader.setChannelSelections([
        [{ id: "time", index: 0 }, { id: "stain", index: "A" }],
        [{ id: "time", index: 0 }, { id: "stain", index: "C" }],
    ]);
    
    const tiles = await loader.getTile({ x: 0, y: 0, z: 2 });
    const rasters = await loader.getRaster({ z: 2 });
})();
```
### tiff -- In progress

## Development

### Install
```bash
$ git clone https://github.com/hubmapconsortium/vitessce-image-loader.git
$ cd vitessce-image-loader
$ npm install
```

### Build
```bash
$ npm run build
```

### Test
```bash
$ npm run test # or npm run test:watch
```
