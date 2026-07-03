/**
 * Injects CSS that locks the page layout to full-height with no scroll.
 * Used on Expenses and Customers pages that host fixed-height scrollable tables.
 */
export function PageLayoutLock() {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        html, body { height: 100% !important; overflow: hidden !important; }
        main { overflow: hidden !important; display: flex !important; flex-direction: column !important; height: 100% !important; }
        main > div { display: flex !important; flex-direction: column !important; flex: 1 !important; min-height: 0 !important; width: 100% !important; }
      `
    }} />
  );
}
