const TRACKED_STOCKS = [
  'SCOM', // Safaricom PLC
  'EQTY', // Equity Group Holdings
  'KCB',  // KCB Group PLC
  'COOP', // Co-operative Bank of Kenya
  'EABL', // East African Breweries
  'BAT',  // British American Tobacco Kenya
  'ABSA', // Absa Bank Kenya
  'KPLC', // Kenya Power
  'KEGN', // KenGen
  'SCAN', // ScanGroup Ltd
];

const FALLBACK_QUOTES = [
  {
    symbol: 'SCOM',
    name: 'Safaricom Plc',
    price: 28.30,
    change: 0.20,
    changePercent: 0.71,
    volume: '40.6M'
  },
  {
    symbol: 'EQTY',
    name: 'Equity Group Holdings Ltd',
    price: 59.50,
    change: 0.00,
    changePercent: 0.00,
    volume: '2.36M'
  },
  {
    symbol: 'KCB',
    name: 'KCB Group PLC',
    price: 58.25,
    change: 0.00,
    changePercent: 0.00,
    volume: '2.11M'
  },
  {
    symbol: 'COOP',
    name: 'Co-operative Bank of Kenya Ltd',
    price: 20.35,
    change: 0.30,
    changePercent: 1.50,
    volume: '403.9K'
  },
  {
    symbol: 'BAT',
    name: 'British American Tobacco Kenya',
    price: 450.00,
    change: 0.50,
    changePercent: 0.11,
    volume: '12.9K'
  },
  {
    symbol: 'ABSA',
    name: 'Absa Bank Kenya Plc',
    price: 22.50,
    change: 0.00,
    changePercent: 0.00,
    volume: '4.43M'
  },
  {
    symbol: 'KPLC',
    name: 'Kenya Power & Lighting Company',
    price: 13.15,
    change: -0.30,
    changePercent: -2.23,
    volume: '1.87M'
  },
  {
    symbol: 'KEGN',
    name: 'KenGen Plc',
    price: 9.98,
    change: 0.80,
    changePercent: 8.71,
    volume: '6.13M'
  },
  {
    symbol: 'SCAN',
    name: 'ScanGroup Limited',
    price: 2.86,
    change: -0.03,
    changePercent: -1.04,
    volume: '153.6K'
  }
];

const FALLBACK_NEWS = [
  {
    id: 'fn_1',
    title: 'Safaricom Volume Extends Surge on Market Entry',
    date: 'Jun 20, 2026 12:45 GMT',
    summary: 'SCOM led transactions on the Nairobi Securities Exchange as institutional interest rallied around defensive blue chips.',
    source: 'NSE Forum',
    url: 'https://afx.kwayisi.org/nse/',
    sentiment: 'Bullish',
    sentimentScore: 0.35,
  },
  {
    id: 'fn_2',
    title: 'Patrick shared a market perspective',
    date: 'Jan 22, 2026 10:56 GMT',
    summary: 'KNRE is on a Massive Sale, KNRE shares trade at roughly KES 3.19, but the actual value of the assets backing each share (Book Value) is likely over KES 15.00. You are essentially buying a KES 1000 note for KES 200. It is deeply undervalued.',
    source: 'NSE Forum',
    url: 'https://afx.kwayisi.org/nse/',
    sentiment: 'Bullish',
    sentimentScore: 0.45,
  },
];

function parseKenyaQuotes(html) {
  const quotes = [];
  const table3Match = html.match(/<table[^>]*>[\s\S]*?<th>Ticker[\s\S]*?<tbody>([\s\S]*?)<\/table>/i);
  if (!table3Match) return [];

  const tbody = table3Match[1];
  const rows = tbody.split('<tr>');

  for (const row of rows) {
    if (!row.trim()) continue;

    const match = row.match(/href=[^>]+>([^<]+)<\/a>.*?href=[^>]+>([^<]+)<\/a>.*?<td>([^<]*)<td>([^<]*)(?:<td[^>]*>([^<]*))?/);
    if (match) {
      const symbol = match[1].trim();
      const name = match[2].trim();
      const volumeStr = match[3].trim();
      const priceStr = match[4].trim().replace(/,/g, '');
      const changeStr = match[5] ? match[5].trim().replace(/,/g, '') : '0.00';

      const price = parseFloat(priceStr);
      const change = parseFloat(changeStr);
      const previousPrice = price - change;
      const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

      quotes.push({
        symbol,
        name,
        price,
        change,
        changePercent,
        volume: volumeStr || '0',
      });
    }
  }
  return quotes;
}

function parseKenyaDiscussions(html) {
  const news = [];
  const commentRegex = /<li\s+id=(\d+)>[\s\S]*?<img\s+src=([^\s>]+)\s+alt="([^"]*)"[^>]*>[\s\S]*?<span\s+class=b>([^<]+)<\/span>[\s\S]*?<span\s+class="s\s+g">([^<]+)<\/span>[\s\S]*?<p>([\s\S]*?)(?:<ul>|<ol>|<li|<\/li>|$)/gi;

  let match;
  let idx = 0;

  while ((match = commentRegex.exec(html)) !== null && idx < 8) {
    const id = match[1];
    let avatarUrl = match[2];
    if (avatarUrl.startsWith('//')) {
      avatarUrl = 'https:' + avatarUrl;
    }
    const username = match[3] || match[4];
    const dateStr = match[5].trim();

    const text = match[6]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();

    let sentiment = 'Neutral';
    let sentimentScore = 0;
    const lowerText = text.toLowerCase();

    const posKeywords = ['buy', 'undervalued', 'up', 'surge', 'gains', 'bullish', 'dividend', 'growth', 'profit', 'recovery', 'rebounded'];
    const negKeywords = ['sell', 'overvalued', 'down', 'decline', 'drop', 'bearish', 'loss', 'dipped', 'disappointed', 'undervalued?', 'cuts'];

    let posCount = 0;
    let negCount = 0;
    posKeywords.forEach(kw => {
      if (lowerText.includes(kw)) posCount++;
    });
    negKeywords.forEach(kw => {
      if (lowerText.includes(kw)) negCount++;
    });

    if (posCount > negCount) {
      sentiment = posCount - negCount >= 2 ? 'Bullish' : 'Somewhat-Bullish';
      sentimentScore = 0.3 + (posCount - negCount) * 0.1;
    } else if (negCount > posCount) {
      sentiment = negCount - posCount >= 2 ? 'Bearish' : 'Somewhat-Bearish';
      sentimentScore = -0.3 - (negCount - posCount) * 0.1;
    }

    news.push({
      id: `forum_${id}`,
      title: `${username} shared a market perspective`,
      date: dateStr,
      summary: text,
      source: 'NSE Forum',
      url: `https://afx.kwayisi.org/nse/#${id}`,
      sentiment,
      sentimentScore,
      banner_image: avatarUrl,
    });
    idx++;
  }
  return news;
}

exports.getQuotes = async (req, res) => {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
    };
    const response = await fetch('https://afx.kwayisi.org/nse/', { headers });
    if (!response.ok) {
      return res.json(FALLBACK_QUOTES);
    }

    const html = await response.text();
    const quotes = parseKenyaQuotes(html);

    if (quotes.length === 0) {
      return res.json(FALLBACK_QUOTES);
    }

    quotes.sort((a, b) => {
      const aTracked = TRACKED_STOCKS.indexOf(a.symbol);
      const bTracked = TRACKED_STOCKS.indexOf(b.symbol);
      if (aTracked !== -1 && bTracked !== -1) return aTracked - bTracked;
      if (aTracked !== -1) return -1;
      if (bTracked !== -1) return 1;
      return 0;
    });

    return res.json(quotes);
  } catch (error) {
    console.error('getQuotes error:', error);
    return res.json(FALLBACK_QUOTES);
  }
};

exports.getNews = async (req, res) => {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
    };
    const response = await fetch('https://afx.kwayisi.org/nse/', { headers });
    if (!response.ok) {
      return res.json(FALLBACK_NEWS);
    }

    const html = await response.text();
    const discussions = parseKenyaDiscussions(html);

    if (discussions.length === 0) {
      return res.json(FALLBACK_NEWS);
    }

    return res.json(discussions);
  } catch (error) {
    console.error('getNews error:', error);
    return res.json(FALLBACK_NEWS);
  }
};
