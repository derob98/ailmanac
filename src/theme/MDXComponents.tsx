import MDXComponents from '@theme-original/MDXComponents';
import LevelBadge from '@site/src/components/LevelBadge';
import VerifyNote from '@site/src/components/VerifyNote';
import ModelTable from '@site/src/components/ModelTable';
import PromptBuilder from '@site/src/components/PromptBuilder';
import ModelPicker from '@site/src/components/ModelPicker';
import TokenEstimator from '@site/src/components/TokenEstimator';

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
};
