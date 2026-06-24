import MDXComponents from '@theme-original/MDXComponents';
import LevelBadge from '@site/src/components/LevelBadge';
import VerifyNote from '@site/src/components/VerifyNote';
import ModelTable from '@site/src/components/ModelTable';
import PromptBuilder from '@site/src/components/PromptBuilder';
import ModelPicker from '@site/src/components/ModelPicker';
import TokenEstimator from '@site/src/components/TokenEstimator';
import ClaudeMdGenerator from '@site/src/components/ClaudeMdGenerator';
import McpConfigBuilder from '@site/src/components/McpConfigBuilder';
import CostCalculator from '@site/src/components/CostCalculator';
import FreshnessDashboard from '@site/src/components/FreshnessDashboard';
import PromptDoctor from '@site/src/components/PromptDoctor';
import Quiz from '@site/src/components/Quiz';
import Flashcards from '@site/src/components/Flashcards';
import PromptCard from '@site/src/components/PromptCard';
import Steps from '@site/src/components/Steps';
import Callout from '@site/src/components/Callout';

// Register custom components globally so any .mdx page can use them WITHOUT an
// import statement. Keeps the contributor experience friction-free.
export default {
  ...MDXComponents,
  LevelBadge,
  VerifyNote,
  ModelTable,
  PromptBuilder,
  ModelPicker,
  TokenEstimator,
  ClaudeMdGenerator,
  McpConfigBuilder,
  CostCalculator,
  FreshnessDashboard,
  PromptDoctor,
  Quiz,
  Flashcards,
  PromptCard,
  Steps,
  Callout,
};
