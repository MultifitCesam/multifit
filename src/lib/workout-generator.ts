export interface UserProfile {
  name: string;
  gender?: "masculino" | "feminino" | "outro" | null;
  age: number;
  weight: number;
  height: number;
  level: "iniciante" | "intermediario" | "avancado";
  goal: "emagrecimento" | "hipertrofia" | "condicionamento" | "saude_mental" | "alta_performance";
  bodyType: "ectomorfo" | "mesomorfo" | "endomorfo";
  sleepHours: number;
  sleepQuality: "ruim" | "regular" | "boa" | "excelente";
  weeklyFrequency: number;
  trainingTime: "manha" | "tarde" | "noite";
  focusAreas?: string | null;
  healthConditions?: string | null;
}


export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  videoUrl?: string;
  description: string;
  muscleGroup: string;
  /** Instrução extra adaptada ao perfil (ex.: mulheres, objetivo, nível) */
  tip?: string;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  type: "musculacao" | "funcional" | "cardio" | "descanso";
  warmup: string;
  exercises: Exercise[];
  id?: string;
}

export interface WorkoutPlan {
  id?: string;
  explanation: string;
  weeklyPlan: WorkoutDay[];
  tips: string[];
  evolution: string;
}

const exerciseDB: Record<string, Exercise[]> = {
  peito_maquina: [
    { name: "Supino Máquina", sets: 3, reps: "12-15", rest: "60s", description: "Empurre as barras para frente, controlando o movimento.", muscleGroup: "Peito" },
    { name: "Fly Máquina", sets: 3, reps: "12-15", rest: "60s", description: "Junte os braços na frente do peito na máquina.", muscleGroup: "Peito" },
    { name: "Cross Over Máquina", sets: 3, reps: "12", rest: "60s", description: "Cruze os cabos na frente do corpo.", muscleGroup: "Peito" },
  ],
  peito_livre: [
    { name: "Supino Reto Barra", sets: 4, reps: "8-12", rest: "90s", description: "Deite no banco e empurre a barra para cima.", muscleGroup: "Peito" },
    { name: "Supino Inclinado Halteres", sets: 4, reps: "10-12", rest: "90s", description: "Banco inclinado a 30°, empurre os halteres.", muscleGroup: "Peito" },
    { name: "Crucifixo", sets: 3, reps: "12", rest: "60s", description: "Abra e feche os braços com halteres.", muscleGroup: "Peito" },
  ],
  costas_maquina: [
    { name: "Pulley Frontal", sets: 3, reps: "12-15", rest: "60s", description: "Puxe a barra até o peito sentado na máquina.", muscleGroup: "Costas" },
    { name: "Remada Máquina", sets: 3, reps: "12-15", rest: "60s", description: "Puxe as alças em direção ao abdômen.", muscleGroup: "Costas" },
    { name: "Pulldown", sets: 3, reps: "12", rest: "60s", description: "Puxe a barra para baixo controladamente.", muscleGroup: "Costas" },
  ],
  costas_livre: [
    { name: "Barra Fixa", sets: 4, reps: "8-10", rest: "90s", description: "Eleve o corpo até o queixo passar a barra.", muscleGroup: "Costas" },
    { name: "Remada Curvada", sets: 4, reps: "10-12", rest: "90s", description: "Incline o tronco e puxe a barra ao abdômen.", muscleGroup: "Costas" },
    { name: "Remada Unilateral", sets: 3, reps: "12", rest: "60s", description: "Apoie um joelho no banco e puxe o halter.", muscleGroup: "Costas" },
  ],
  pernas_maquina: [
    { name: "Leg Press", sets: 3, reps: "12-15", rest: "90s", description: "Empurre a plataforma com os pés.", muscleGroup: "Pernas" },
    { name: "Cadeira Extensora", sets: 3, reps: "12-15", rest: "60s", description: "Estenda as pernas na máquina.", muscleGroup: "Pernas" },
    { name: "Cadeira Flexora", sets: 3, reps: "12-15", rest: "60s", description: "Flexione as pernas na máquina.", muscleGroup: "Pernas" },
  ],
  pernas_livre: [
    { name: "Agachamento Livre", sets: 4, reps: "8-12", rest: "120s", description: "Agache com a barra nos ombros.", muscleGroup: "Pernas" },
    { name: "Stiff", sets: 4, reps: "10-12", rest: "90s", description: "Desça a barra mantendo as pernas semi-estendidas.", muscleGroup: "Pernas" },
    { name: "Avanço", sets: 3, reps: "12 cada", rest: "60s", description: "Dê passos largos alternando as pernas.", muscleGroup: "Pernas" },
  ],
  ombros_maquina: [
    { name: "Desenvolvimento Máquina", sets: 3, reps: "12-15", rest: "60s", description: "Empurre as barras para cima na máquina.", muscleGroup: "Ombros" },
    { name: "Elevação Lateral Máquina", sets: 3, reps: "12-15", rest: "60s", description: "Eleve os braços lateralmente na máquina.", muscleGroup: "Ombros" },
  ],
  ombros_livre: [
    { name: "Desenvolvimento Halteres", sets: 4, reps: "10-12", rest: "90s", description: "Empurre os halteres acima da cabeça.", muscleGroup: "Ombros" },
    { name: "Elevação Lateral", sets: 4, reps: "12-15", rest: "60s", description: "Eleve os braços lateralmente com halteres.", muscleGroup: "Ombros" },
    { name: "Elevação Frontal", sets: 3, reps: "12", rest: "60s", description: "Eleve os braços à frente com halteres.", muscleGroup: "Ombros" },
  ],
  bracos_maquina: [
    { name: "Rosca Scott Máquina", sets: 3, reps: "12-15", rest: "60s", description: "Flexione os braços no apoio Scott.", muscleGroup: "Bíceps" },
    { name: "Tríceps Pulley", sets: 3, reps: "12-15", rest: "60s", description: "Empurre a barra para baixo estendendo os braços.", muscleGroup: "Tríceps" },
  ],
  bracos_livre: [
    { name: "Rosca Direta Barra", sets: 4, reps: "10-12", rest: "60s", description: "Flexione os braços com a barra.", muscleGroup: "Bíceps" },
    { name: "Tríceps Testa", sets: 4, reps: "10-12", rest: "60s", description: "Deite e estenda a barra acima da testa.", muscleGroup: "Tríceps" },
    { name: "Rosca Martelo", sets: 3, reps: "12", rest: "60s", description: "Flexione com halteres em posição neutra.", muscleGroup: "Bíceps" },
  ],
  cardio: [
    { name: "Esteira", sets: 1, reps: "20-30 min", rest: "-", description: "Caminhe ou corra na esteira.", muscleGroup: "Cardio" },
    { name: "Bicicleta", sets: 1, reps: "20-30 min", rest: "-", description: "Pedale em ritmo moderado.", muscleGroup: "Cardio" },
    { name: "Elíptico", sets: 1, reps: "20 min", rest: "-", description: "Movimentos elípticos completos.", muscleGroup: "Cardio" },
  ],
  funcional: [
    { name: "Burpee", sets: 3, reps: "10", rest: "45s", description: "Agache, apoie, salte e repita.", muscleGroup: "Full Body" },
    { name: "Mountain Climber", sets: 3, reps: "20 cada", rest: "30s", description: "Alterne as pernas em posição de prancha.", muscleGroup: "Core" },
    { name: "Kettlebell Swing", sets: 3, reps: "15", rest: "45s", description: "Balance o kettlebell com impulso do quadril.", muscleGroup: "Full Body" },
    { name: "Box Jump", sets: 3, reps: "10", rest: "60s", description: "Salte sobre a caixa e desça controlado.", muscleGroup: "Pernas" },
  ],
};

function getExercises(muscle: string, level: string): Exercise[] {
  if (level === "iniciante") {
    return exerciseDB[`${muscle}_maquina`] || exerciseDB[muscle] || [];
  } else if (level === "intermediario") {
    const maq = exerciseDB[`${muscle}_maquina`] || [];
    const livre = exerciseDB[`${muscle}_livre`] || [];
    return [...maq.slice(0, 2), ...livre.slice(0, 1)];
  }
  return [
    ...(exerciseDB[`${muscle}_maquina`] || []).slice(0, 1),
    ...(exerciseDB[`${muscle}_livre`] || exerciseDB[muscle] || []),
  ];
}

const warmups: Record<string, string> = {
  peito: "5 min esteira + rotação de ombros + 15 flexões leves",
  costas: "5 min remada ergométrica + mobilidade de ombros",
  pernas: "5 min bicicleta + agachamento sem peso 2x15",
  gluteos: "5 min bicicleta + ativação de glúteo com mini band 2x15",
  ombros: "5 min elíptico + rotação de ombros com elástico",
  bracos: "5 min esteira + rosca leve 2x15",
  cardio: "3 min caminhada leve + alongamento dinâmico",
  funcional: "5 min pular corda + mobilidade articular completa",
};


// Female-focused exercise additions
const femaleAccessory: Record<string, Exercise[]> = {
  gluteos: [
    { name: "Hip Thrust", sets: 4, reps: "10-12", rest: "90s", description: "Apoie os ombros no banco e empurre o quadril com barra/halter.", muscleGroup: "Glúteos" },
    { name: "Elevação Pélvica", sets: 4, reps: "15", rest: "60s", description: "Deite, joelhos flexionados, eleve o quadril contraindo o glúteo.", muscleGroup: "Glúteos" },
    { name: "Cadeira Abdutora", sets: 3, reps: "15-20", rest: "45s", description: "Abra as pernas contra a resistência da máquina.", muscleGroup: "Glúteos" },
    { name: "Coice na Polia", sets: 3, reps: "12 cada", rest: "45s", description: "Cabo no tornozelo, estenda a perna pra trás contraindo o glúteo.", muscleGroup: "Glúteos" },
    { name: "Búlgaro", sets: 3, reps: "10 cada", rest: "60s", description: "Pé traseiro elevado, agache focando no glúteo da perna da frente.", muscleGroup: "Glúteos" },
  ],
  posterior: [
    { name: "Mesa Flexora", sets: 4, reps: "12-15", rest: "60s", description: "Deitada, flexione as pernas contra a almofada.", muscleGroup: "Posterior" },
    { name: "Stiff com Halteres", sets: 3, reps: "12", rest: "60s", description: "Desça os halteres mantendo as pernas semi-estendidas.", muscleGroup: "Posterior" },
  ],
  core: [
    { name: "Prancha Abdominal", sets: 3, reps: "40s", rest: "30s", description: "Mantenha o corpo reto apoiada nos antebraços.", muscleGroup: "Core" },
    { name: "Abdominal Bicicleta", sets: 3, reps: "20 cada", rest: "30s", description: "Alterne joelho-cotovelo opostos no chão.", muscleGroup: "Core" },
    { name: "Russian Twist", sets: 3, reps: "20", rest: "30s", description: "Sentada, gire o tronco com leve peso.", muscleGroup: "Core" },
  ],
};

export function generateWorkoutPlan(profile: UserProfile): WorkoutPlan {
  const { gender, level, goal, bodyType, sleepHours, sleepQuality, weeklyFrequency, trainingTime } = profile;
  const isFemale = gender === "feminino";

  // Female-focused split prioritizes lower body (glutes/legs 2-3x/week)
  const splitsMale: Record<number, string[][]> = {
    3: [["peito", "ombros"], ["costas", "bracos"], ["pernas"]],
    4: [["peito"], ["costas"], ["pernas"], ["ombros", "bracos"]],
    5: [["peito"], ["costas"], ["pernas"], ["ombros"], ["bracos"]],
    6: [["peito"], ["costas"], ["pernas"], ["ombros"], ["bracos"], ["pernas"]],
  };
  const splitsFemale: Record<number, string[][]> = {
    3: [["gluteos"], ["costas", "bracos"], ["pernas"]],
    4: [["gluteos"], ["costas"], ["pernas"], ["peito", "ombros"]],
    5: [["gluteos"], ["costas"], ["pernas"], ["gluteos"], ["peito", "bracos"]],
    6: [["gluteos"], ["costas"], ["pernas"], ["gluteos"], ["peito", "ombros"], ["bracos"]],
  };
  const splits = isFemale ? splitsFemale : splitsMale;


  const freq = Math.max(3, Math.min(6, weeklyFrequency));
  const split = splits[freq];
  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

  const weeklyPlan: WorkoutDay[] = [];

  split.forEach((muscles, i) => {
    const exercises: Exercise[] = [];
    muscles.forEach(m => {
      if (m === "gluteos") {
        exercises.push(...femaleAccessory.gluteos.slice(0, level === "iniciante" ? 3 : 4));
        exercises.push(...femaleAccessory.posterior.slice(0, 1));
      } else {
        exercises.push(...getExercises(m, level));
      }
    });

    // Women: always add a glute or core accessory on leg days for extra focus
    if (isFemale && muscles.includes("pernas")) {
      exercises.push(femaleAccessory.gluteos[0]);
    }
    // Women: add core finisher 2x per week
    if (isFemale && (i === 1 || i === 4)) {
      exercises.push(...femaleAccessory.core.slice(0, 2));
    }

    // Add cardio for emagrecimento
    if (goal === "emagrecimento" && i % 2 === 0) {
      exercises.push(...exerciseDB.cardio.slice(0, 1));
    }

    // Add functional for condicionamento
    if (goal === "condicionamento") {
      exercises.push(...exerciseDB.funcional.slice(0, 2));
    }

    // Reduce intensity if poor sleep
    if (sleepQuality === "ruim" || sleepHours < 6) {
      exercises.forEach(e => {
        e.sets = Math.max(2, e.sets - 1);
        e.rest = "90s";
      });
    }


    weeklyPlan.push({
      day: days[i],
      focus: muscles.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(" + "),
      type: "musculacao",
      warmup: warmups[muscles[0]] || warmups.funcional,
      exercises,
    });
  });

  // Fill remaining days
  for (let i = split.length; i < 7; i++) {
    if (i === 6 || freq <= 4) {
      weeklyPlan.push({
        day: days[i],
        focus: "Descanso",
        type: "descanso",
        warmup: "",
        exercises: [],
      });
    } else {
      weeklyPlan.push({
        day: days[i],
        focus: "Cardio / Funcional",
        type: goal === "emagrecimento" ? "cardio" : "funcional",
        warmup: warmups.cardio,
        exercises: goal === "emagrecimento" ? exerciseDB.cardio : exerciseDB.funcional.slice(0, 3),
      });
    }
  }

  const levelLabel = { iniciante: "iniciante", intermediario: "intermediário", avancado: "avançado" }[level];
  const goalLabel = { emagrecimento: "emagrecimento", hipertrofia: "hipertrofia", condicionamento: "condicionamento", saude_mental: "saúde mental", alta_performance: "alta performance" }[goal];
  const bodyLabel = { ectomorfo: "ectomorfo", mesomorfo: "mesomorfo", endomorfo: "endomorfo" }[bodyType];

  const explanation = `Plano criado para perfil ${levelLabel}, com foco em ${goalLabel}. ` +
    `Biotipo ${bodyLabel}: ${bodyType === "ectomorfo" ? "prioridade em cargas pesadas e descanso" : bodyType === "endomorfo" ? "mais cardio e circuitos" : "treino equilibrado"}. ` +
    `${sleepQuality === "ruim" ? "Intensidade reduzida devido à qualidade do sono." : ""} ` +
    `Treinos ajustados para o período da ${trainingTime === "manha" ? "manhã" : trainingTime === "tarde" ? "tarde" : "noite"}.`;

  const tips = [
    "Hidrate-se com pelo menos 2L de água por dia",
    `${goal === "hipertrofia" ? "Consuma 1.8-2.2g de proteína por kg de peso" : "Mantenha uma dieta equilibrada"}`,
    `Durma pelo menos ${level === "avancado" ? "8" : "7"} horas por noite`,
    trainingTime === "manha" ? "Faça um lanche leve 30 min antes do treino" : "Evite refeições pesadas 2h antes do treino",
    "Respeite os dias de descanso para recuperação muscular",
  ];

  const evolution = level === "iniciante"
    ? "Após 4 semanas, aumente as cargas em 5-10% e adicione 1 série por exercício."
    : level === "intermediario"
    ? "Após 3 semanas, inclua técnicas avançadas como drop-set e rest-pause."
    : "Periodize entre semanas de volume e intensidade. Deload a cada 4 semanas.";

  return { explanation, weeklyPlan, tips, evolution };
}

export function calculateCalories(weight: number, height: number, age: number, goal: string): number {
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const multiplier = goal === "emagrecimento" ? 1.2 : goal === "hipertrofia" ? 1.6 : 1.4;
  return Math.round(bmr * multiplier);
}

export function calculateWeightLossTime(currentWeight: number, targetWeight: number): number {
  const diff = currentWeight - targetWeight;
  return Math.max(1, Math.round(diff / 0.5)); // 0.5kg per week
}
