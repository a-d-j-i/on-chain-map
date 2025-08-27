export function getEmptyTile(height = 16, width = 16): boolean[][] {
  return Array.from({length: height}, () => Array.from({length: width}, () => false));
}

export function getEmptyExtendedTile(): boolean[][] {
  return getEmptyTile(3 * 16, 16 * 3);
}

export function tileToArray(data: bigint | bigint[]): boolean[][] {
  if (!Array.isArray(data)) {
    data = [data];
  }
  const ret = [];
  for (let r = 0; r < data.length; r++) {
    for (let s = 0n; s < 16n; s++) {
      const line = [];
      for (let t = 0n; t < 16n; t++) {
        line.push(((data[r] >> (s * 16n + t)) & 1n) == 1n);
      }
      ret.push(line);
    }
  }
  return ret;
}

export function printTile(jsTile: boolean[][], compact = false): void {
  if (compact) {
    console.log(jsTile.map(x => x.reduce((acc, val) => acc + (val ? 'X ' : 'O '), '')));
    return;
  }
  console.log(
    '     ',
    [...Array(jsTile[0].length).keys()].reduce((acc, val) => acc + val.toString().substring(0, 1).padEnd(2), ''),
  );
  console.log(
    '     ',
    [...Array(jsTile[0].length).keys()].reduce((acc, val) => acc + val.toString().substring(1, 2).padEnd(2), ''),
  );
  for (let i = 0; i < jsTile.length; i++) {
    console.log(
      i.toString().padEnd(5),
      jsTile[i].reduce((acc, val) => acc + (val ? 'X ' : 'O '), ''),
    );
  }
}

export function setRectangle(
  tile: boolean[][],
  x0: number,
  y0: number,
  dx: number,
  dy: number,
  val = true,
): boolean[][] {
  for (let i = 0; i < dx; i++) {
    for (let j = 0; j < dy; j++) {
      tile[y0 + j][x0 + i] = val;
    }
  }
  return tile;
}

type ExtendedTileLine = {
  up: bigint;
  middle: {data: bigint};
  down: bigint;
};
type Tile = {data: bigint};
type ExtendedTile = {
  left: Tile;
  up: bigint;
  middle: Tile;
  down: bigint;
  right: Tile;
};

export function extendedTileToArray(data: ExtendedTile): boolean[][] {
  const lineToArray = (line: ExtendedTileLine) => tileToArray([line.up, line.middle.data, line.down]);
  const left = lineToArray({up: 0n, middle: data.left, down: 0n});
  const center = lineToArray(data);
  const right = lineToArray({up: 0n, middle: data.right, down: 0n});
  const ret = [];
  for (let i = 0; i < left.length; i++) {
    ret.push([...left[i], ...center[i], ...right[i]]);
  }
  return ret;
}

// export function lineToArray(data: bigint): boolean[][] {
//   const ret = [];
//   const bn = BigNumber.from(data);
//   for (let s = 0; s < 8; s++) {
//     const line = [];
//     for (let t = 0; t < 24; t++) {
//       line.push(
//         bn
//           .shr(s * 24 + t)
//           .and(1)
//           .eq(1),
//       );
//     }
//     ret.push(line);
//   }
//   return ret;
// }

export function resultToArray(strs: string[]): boolean[][] {
  return strs.map(x =>
    x
      .split(' ')
      .map(x => x.trim())
      .filter(x => x.trim() != '')
      .map(x => x != 'O'),
  );
}

export function tileWithCoordToJS(data: {coord: bigint; tile: {data: bigint}}): {
  tile: boolean[][];
  x: bigint;
  y: bigint;
} {
  return {
    tile: tileToArray([data.tile.data]),
    x: (data.coord & (2n ** 128n - 1n)) * 16n,
    y: (data.coord >> 128n) * 16n,
  };
}

export function drawTile(rectangles: number[][], initFunc: () => boolean[][]): boolean[][] {
  return rectangles.reduce((acc, val) => setRectangle(acc, val[0], val[1], val[2], val[3]), initFunc());
}

export function drawExtendedTile(rectangles: number[][]): boolean[][] {
  return drawTile(rectangles, getEmptyExtendedTile);
}

export function printTileWithCoord(jsTile: {tile: boolean[][]; x: bigint; y: bigint}): void {
  console.log('X', jsTile.x.toString(), '0x' + jsTile.x.toString(16));
  console.log('Y', jsTile.y.toString(), '0x' + jsTile.y.toString(16));
  printTile(jsTile.tile);
}

export function printMap(
  tiles: {
    tile: boolean[][];
    x: bigint;
    y: bigint;
  }[],
  printEmptyTiles = true,
): void {
  for (const tile of tiles.sort((a, b) => (a.x < b.x || (a.x == b.x && a.y < b.y) ? -1 : 1))) {
    if (!printEmptyTiles && tile.tile.flat(1).every(x => !x)) {
      continue;
    }
    printTileWithCoord(tile);
  }
}

export function createTestMap(maxx: number, maxy: number, cant: number): number[][] {
  const rectangles = [];
  for (let i = 0; i < cant; i++) {
    const x = Math.floor(maxx * Math.random());
    const y = Math.floor(maxy * Math.random());
    const size = 1 + Math.floor(16 * Math.random());
    // The library only supports setting values in the middle of a tile
    rectangles.push([x, y, Math.min(16 - (x % 16), 16 - (y % 16), size)]);
  }
  return rectangles;
}
