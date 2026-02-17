export interface Threat {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  mitigation: string;
  impact: string;
}

export interface BenchmarkScore {
  category: string;
  score: number; // 0-100
  details: string;
}

export interface ModelEvaluation {
  id: string;
  modelName: string;
  architecture: string;
  useCase: string;
  timestamp: string;
  threats: Threat[];
  scores: BenchmarkScore[];
  overallRiskScore: number;
}

export enum OWASPCategory {
  PROMPT_INJECTION = "LLM01: Prompt Injection",
  INSECURE_OUTPUT = "LLM02: Insecure Output Handling",
  TRAINING_DATA_POISONING = "LLM03: Training Data Poisoning",
  MODEL_DOS = "LLM04: Model Denial of Service",
  SUPPLY_CHAIN_VULN = "LLM05: Supply Chain Vulnerabilities",
  SENSITIVE_INFO_DISCLOSURE = "LLM06: Sensitive Information Disclosure",
  INSECURE_PLUGIN_DESIGN = "LLM07: Insecure Plugin Design",
  EXCESSIVE_AGENCY = "LLM08: Excessive Agency",
  OVERRELIANCE = "LLM09: Overreliance",
  MODEL_THEFT = "LLM10: Model Theft"
}