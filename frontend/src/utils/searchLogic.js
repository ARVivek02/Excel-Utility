const devanagariMap = {
  'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ए': 'e', 'ऐ': 'e', 'ओ': 'o', 'औ': 'o',
  'क': 'k', 'ख': 'k', 'ग': 'g', 'घ': 'g', 'ङ': 'n',
  'च': 'ch', 'छ': 'ch', 'ज': 'j', 'झ': 'j', 'ञ': 'n',
  'ट': 't', 'ठ': 't', 'ड': 'd', 'ढ': 'd', 'ण': 'n',
  'त': 't', 'थ': 't', 'द': 'd', 'ध': 'd', 'न': 'n',
  'प': 'p', 'फ': 'p', 'ब': 'b', 'भ': 'b', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 's', 'ष': 's', 'स': 's', 'ह': 'h',
  'ळ': 'l', 'क्ष': 'x', 'ज्ञ': 'gy',
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'r', 'े': 'e', 'ै': 'e', 'ो': 'o', 'ौ': 'o', 'ं': 'n', 'ः': 'h', '्': ''
};

const transliterate = (text) => {
  let result = "";
  for (let char of String(text).toLowerCase()) {
    result += devanagariMap[char] || char;
  }
  return result;
};

const getSkeleton = (text) => {
  let skel = text.replace(/[aeiouy\W0-9_]/g, '');
  return skel.replace(/(.)\1+/g, '$1'); 
};

const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

export const executeSmartSearch = (masterData, criteriaList) => {
  const activeCriteria = criteriaList.filter(c => c.column && c.query.trim() !== "");
  
  if (activeCriteria.length === 0) return [];

  return masterData.filter(row => {
    return activeCriteria.every(criteria => {
      const cellValue = String(row[criteria.column] || "");
      const queryTrans = transliterate(criteria.query);
      const querySkel = getSkeleton(queryTrans);
      const cellTrans = transliterate(cellValue);
      const cellSkel = getSkeleton(cellTrans);
      
      // Tier 1: Fast Exact Substring Match
      if (cellTrans.includes(queryTrans)) return true;

      // Tier 2: Fast Phonetic Substring Match (Handles words without spaces)
      if (querySkel.length > 0 && cellSkel.includes(querySkel)) return true;

      // Tier 3: Smart Phrase Matcher (Fixes the "tripati" and "vardas" sentence issue)
      // Breaks the search into individual words
      const queryWords = queryTrans.split(/\s+/).filter(w => w.length > 0);
      const cellWords = cellTrans.split(/\s+/).filter(w => w.length > 0);

      if (queryWords.length > 0) {
        let matchedWordsCount = 0;

        for (let qWord of queryWords) {
          const qWordSkel = getSkeleton(qWord);
          let wordMatched = false;

          for (let cWord of cellWords) {
            // Direct word match
            if (cWord.includes(qWord)) { 
              wordMatched = true; 
              break; 
            }

            const cWordSkel = getSkeleton(cWord);
            
            // Substring skeleton match
            if (qWordSkel.length > 0 && cWordSkel.includes(qWordSkel)) { 
              wordMatched = true; 
              break; 
            }

            // Typo match (slightly more forgiving algorithm)
            if (qWordSkel.length > 0 && cWordSkel.length > 0) {
              const maxTypos = Math.max(1, Math.ceil(qWordSkel.length / 3));
              if (levenshtein(qWordSkel, cWordSkel) <= maxTypos) {
                wordMatched = true; 
                break;
              }
            }
          }
          if (wordMatched) matchedWordsCount++;
        }

        // If at least 75% of the typed words match, consider it a successful row match!
        // E.g., If you type 6 words, and 5 match, it pulls the row.
        const requiredMatches = Math.ceil(queryWords.length * 0.75);
        if (matchedWordsCount >= requiredMatches) return true;
      }
      
      return false; 
    });
  });
};