const cache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export async function loadDuckAssets() {
  if (cache.has('ducks')) return cache.get('ducks');

  const [duck1, duck2, shadow] = await Promise.all([
    loadImage('/assets/ducks/duck-1.png'),
    loadImage('/assets/ducks/duck-2.png'),
    loadImage('/assets/ducks/duck-shadow.png'),
  ]);

  const assets = {
    ducks: [duck1, duck2],
    shadow,
  };

  cache.set('ducks', assets);
  return assets;
}
