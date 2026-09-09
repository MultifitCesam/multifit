// Maps exercise names to YouTube search URLs for demo videos.
// Using search links avoids embedding third-party content and keeps the app light.

export function getExerciseVideoUrl(exerciseName: string): string {
  const query = encodeURIComponent(`${exerciseName} execução correta`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

// Curated direct video ids for the most common exercises. If missing we fall back to search.
const CURATED: Record<string, string> = {
  "Supino Reto Barra": "rT7DgCr-3pg",
  "Supino Inclinado Halteres": "8urE8Z8AMQ4",
  "Agachamento Livre": "Dy28eq2PjcM",
  "Levantamento Terra": "op9kVnSso6Q",
  "Stiff": "1uDiW5--rAE",
  "Leg Press": "IZxyjW7MPJQ",
  "Cadeira Extensora": "YyvSfVjQeL0",
  "Cadeira Flexora": "1Tq3QdYUuHs",
  "Hip Thrust": "xDmFkJxPzeM",
  "Elevação Pélvica": "SEdqd1n0cvg",
  "Cadeira Abdutora": "u3M9L0X7Fyw",
  "Barra Fixa": "eGo4IYlbE5g",
  "Remada Curvada": "kBWAon7ItDw",
  "Pulley Frontal": "CAwf7n6Luuc",
  "Desenvolvimento Halteres": "qEwKCR5JCog",
  "Elevação Lateral": "3VcKaXpzqRo",
  "Rosca Direta Barra": "kwG2ipFRgfo",
  "Rosca Martelo": "TwD-YGVP4Bk",
  "Tríceps Testa": "d_KZxkY_0cM",
  "Tríceps Pulley": "vB5OHsJ3EME",
  "Prancha Abdominal": "ASdvN_XEl_c",
  "Burpee": "TU8QYVW0gDU",
  "Búlgaro": "2C-uNgKwPLE",
  "Coice na Polia": "SqO-VUEak2M",
  "Mesa Flexora": "1Tq3QdYUuHs",
  "Stiff com Halteres": "2SHsk9AzdjA",
  "Abdominal Bicicleta": "9FGilxCbdz8",
  "Russian Twist": "wkD8rjkodUI",
  "Avanço": "QOVaHwm-Q6U",
  "Remada Unilateral": "pYcpY20QaE8",
  "Elevação Frontal": "hRJ6tR5-if0",
  "Crucifixo": "eozdVDA78K0",
  "Mountain Climber": "nmwgirgXLYM",
  "Kettlebell Swing": "YSxHifyI6s8",
};

export function getExerciseEmbedUrl(exerciseName: string): string | null {
  const id = CURATED[exerciseName];
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
