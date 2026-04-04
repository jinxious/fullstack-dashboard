/**
 * Smart Column Matcher
 * Fuzzy-matches uploaded file columns against template expected columns
 */

// Levenshtein distance
function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Common synonyms for column name matching
const SYNONYMS = {
  'amount': ['amt', 'total', 'sum', 'value', 'price', 'cost'],
  'sales': ['revenue', 'income', 'total sales', 'net sales'],
  'date': ['datetime', 'timestamp', 'time', 'created', 'created_at', 'createdat'],
  'name': ['title', 'label', 'description'],
  'category': ['type', 'group', 'class', 'segment'],
  'quantity': ['qty', 'count', 'units', 'volume'],
  'id': ['identifier', 'key', 'code', 'number', 'no'],
  'region': ['area', 'location', 'territory', 'zone'],
  'product': ['item', 'sku', 'goods'],
  'customer': ['client', 'buyer', 'account'],
  'status': ['state', 'condition'],
  'email': ['mail', 'email address'],
  'phone': ['telephone', 'mobile', 'contact'],
  'country': ['nation', 'state'],
  'city': ['town', 'locality'],
  'profit': ['margin', 'earnings', 'net income'],
  'discount': ['rebate', 'reduction'],
  'order': ['purchase', 'transaction']
};

function normalize(str) {
  return str.toLowerCase().replace(/[_\-\s]+/g, ' ').trim();
}

function areSynonyms(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    const group = [key, ...syns];
    const aIn = group.some(s => na.includes(s) || s.includes(na));
    const bIn = group.some(s => nb.includes(s) || s.includes(nb));
    if (aIn && bIn) return true;
  }
  return false;
}

/**
 * Calculate match confidence between two column names (0-100)
 */
function matchConfidence(templateCol, uploadedCol) {
  const tNorm = normalize(templateCol);
  const uNorm = normalize(uploadedCol);

  // Exact match
  if (tNorm === uNorm) return 100;

  // One contains the other
  if (tNorm.includes(uNorm) || uNorm.includes(tNorm)) return 90;

  // Synonym match
  if (areSynonyms(templateCol, uploadedCol)) return 85;

  // Levenshtein-based similarity
  const maxLen = Math.max(tNorm.length, uNorm.length);
  if (maxLen === 0) return 0;
  const dist = levenshtein(tNorm, uNorm);
  const similarity = ((maxLen - dist) / maxLen) * 100;

  return Math.round(similarity);
}

/**
 * Match uploaded columns against template expected columns
 * @param {Array<{name, type}>} templateColumns - expected columns from template
 * @param {Array<{name, type}>} uploadedColumns - columns from uploaded file
 * @returns {Array<{templateCol, uploadedCol, confidence, autoMatched}>}
 */
function matchColumns(templateColumns, uploadedColumns) {
  const results = [];
  const usedUploaded = new Set();

  // First pass: find best matches
  for (const tCol of templateColumns) {
    let bestMatch = null;
    let bestConfidence = 0;

    for (const uCol of uploadedColumns) {
      if (usedUploaded.has(uCol.name)) continue;

      let confidence = matchConfidence(tCol.name, uCol.name);

      // Boost confidence if types also match
      if (tCol.type === uCol.type && confidence >= 50) {
        confidence = Math.min(100, confidence + 5);
      }

      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = uCol;
      }
    }

    const autoMatched = bestConfidence >= 80;

    if (bestMatch && bestConfidence >= 40) {
      results.push({
        templateCol: tCol.name,
        templateType: tCol.type,
        uploadedCol: bestMatch.name,
        uploadedType: bestMatch.type,
        confidence: bestConfidence,
        autoMatched
      });
      if (autoMatched) {
        usedUploaded.add(bestMatch.name);
      }
    } else {
      results.push({
        templateCol: tCol.name,
        templateType: tCol.type,
        uploadedCol: null,
        uploadedType: null,
        confidence: 0,
        autoMatched: false
      });
    }
  }

  return results;
}

module.exports = { matchColumns, matchConfidence, levenshtein };
