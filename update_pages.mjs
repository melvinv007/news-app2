import fs from 'fs';
import path from 'path';

const pages = [
  'app/(app)/world/page.tsx',
  'app/(app)/india/page.tsx',
  'app/(app)/mumbai/page.tsx',
  'app/(app)/ai-tech/page.tsx',
  'app/(app)/business/page.tsx',
  'app/(app)/sports/cricket/page.tsx',
  'app/(app)/sports/football/page.tsx',
  'app/(app)/sports/f1/page.tsx',
  'app/(app)/sports/others/page.tsx' // Note: user prompt says 'others' but the project might be 'other' let's check. Assuming 'others'
];

async function updatePage(file) {
  const fullPath = path.resolve(file);
  // It's possible the file is named "other" instead of "others".
  let actualPath = fullPath;
  if (!fs.existsSync(actualPath) && file.includes('others')) {
    actualPath = actualPath.replace('others', 'other');
    if (!fs.existsSync(actualPath)) {
      console.log('Skipping ' + file + ', missing.');
      return;
    }
  } else if (!fs.existsSync(actualPath)) {
    console.log('Skipping ' + file + ', missing.');
    return;     
  }

  let code = fs.readFileSync(actualPath, 'utf8');

  // Change PAGE_SIZE
  code = code.replace(/const PAGE_SIZE = \d+;/g, 'const PAGE_SIZE = 50;');

  // Check if offset exists
  if (code.includes('const [offset, setOffset]')) {
    console.log(`Skipping ${file}, already updated.`);
    return;
  }

  // Add offset & hasMore state
  code = code.replace(
    /const \[articles, setArticles\] = useState<Article\[\]>\(\[\]\);/g,
    `const [articles, setArticles] = useState<Article[]>([]);\n  const [offset, setOffset] = useState(0);\n  const [hasMore, setHasMore] = useState(true);`
  );

  // Add specific offset argument depending on RPC or standard range
  if (code.includes('get_recommended_articles')) {
    code = code.replace(
      /{ p_category: (.*?), p_limit: PAGE_SIZE }/g,
      `{ p_category: $1, p_limit: PAGE_SIZE, p_offset: offset }`
    );
  } else {
    code = code.replace(/\.limit\(PAGE_SIZE\)/g, `.range(offset, offset + PAGE_SIZE - 1)`);
  }

  // Handle data array manipulation
  code = code.replace(
    /if \(data\) {\s+setArticles\(data( as Article\[\])?\);\s+setLastUpdated\(new Date\(\)\.toISOString\(\)\);\s+}/g,
    `if (data) {
      if (data.length < PAGE_SIZE) setHasMore(false);
      if (offset === 0) setArticles(data$1);
      else setArticles(prev => [...prev, ...data$1]);
      setLastUpdated(new Date().toISOString());
    }`
  );

  // useCallback dependencies
  code = code.replace(/}, \[\]\);/g, '}, [offset]);');
  
  // Actually some components might have `const fetchArticles = useCallback(async () => {`
  // if `data as Article[]`, make sure it replaces properly.
  // Wait, `data as Article[]` is mostly only in world/page.tsx.

  // Add the Load More button
  const loadMoreBtn = `\n      {hasMore && (
        <button
          onClick={() => setOffset(prev => prev + 50)}
          className="mx-auto mt-8 px-6 py-3 rounded-lg font-sans text-sm font-medium transition-colors block"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        >
          Load more
        </button>
      )}`;

  // The button should go below `<ArticleGrid ... />`
  code = code.replace(
    /<ArticleGrid\s+articles={articles}\s+loading={loading}\s+onOpenReadingMode={handleOpenReadingMode}\s+\/>/g,
    `<ArticleGrid \n        articles={articles}\n        loading={loading}\n        onOpenReadingMode={handleOpenReadingMode}\n      />` + loadMoreBtn
  );

  fs.writeFileSync(actualPath, code);
  console.log('Updated ' + actualPath);
}

for (const page of pages) {
  updatePage(page).catch(console.error);
}
