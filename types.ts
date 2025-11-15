
export interface Example {
  sentence: string;
  translation: string;
}

export interface WordForm {
  pos: string;
  word: string;
  definition: string;
  example: string;
  exampleTranslation: string;
}

export interface RelatedWord {
  word: string;
  translation: string;
  breakdown: string;
}

export interface Etymology {
  root: string;
  rootSource: string;
  rootMeaning: string;
  rootDevelopment: string;
  relatedWords: RelatedWord[];
}

export interface Synonym {
  word: string;
  usageDifference: string;
  example: string;
  exampleTranslation: string;
}

export interface ConfusableWord {
  word: string;
  pos: string;
  definition: string;
}

export interface WordDetails {
  pos: string;
  syllabification: string;
  pronunciation: string;
  commonMeaning: string;
  etymologicalMeaning: string;
  examples: Example[];
  forms: WordForm[];
  etymology: Etymology;
  synonyms: Synonym[];
  confusableWords: ConfusableWord[];
}

export interface SavedWord {
    word: string;
    details: WordDetails;
    similarWords: string[];
}