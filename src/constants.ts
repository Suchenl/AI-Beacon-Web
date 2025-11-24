
import { Pillar, TimelineEvent, ModelCardData } from './types';

export const TIMELINE_DATA: TimelineEvent[] = [
  {
    id: 'alexnet',
    year: '2012',
    fullDate: 'Sep 30',
    title: 'AlexNet',
    description: 'The deep convolutional neural network that kickstarted the modern Deep Learning revolution by winning the ImageNet competition by a huge margin.',
    category: 'Vision',
    authors: 'Krizhevsky, Sutskever, Hinton',
    impact: 'Proved CNNs could scale to large data.',
    link: 'https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html'
  },
  {
    id: 'attention',
    year: '2017',
    fullDate: 'Jun 12',
    title: 'Attention Is All You Need',
    description: 'Introduction of the Transformer architecture, dispensing with recurrence and convolutions entirely.',
    category: 'Language',
    authors: 'Vaswani et al. (Google)',
    impact: 'The foundation of all modern LLMs (GPT, BERT, Llama).',
    link: 'https://arxiv.org/abs/1706.03762'
  },
  {
    id: 'gpt3',
    year: '2020',
    fullDate: 'May 28',
    title: 'GPT-3',
    description: 'Language Models are Few-Shot Learners. Demonstrated that scaling up model size enables zero-shot and few-shot generalization.',
    category: 'Generative',
    authors: 'Brown et al. (OpenAI)',
    impact: 'Shifted the paradigm to prompt engineering.',
    link: 'https://arxiv.org/abs/2005.14165'
  }
];

export const CLASSIC_MODELS: ModelCardData[] = [
  {
    id: 'bert',
    name: 'BERT',
    year: '2018',
    authors: 'Devlin et al. (Google)',
    type: 'Encoder-only',
    description: 'Bidirectional Encoder Representations from Transformers. Used Masked Language Modeling (MLM) to learn deep bidirectional representations.',
    impact: 'Revolutionized NLP tasks like question answering and sentiment analysis.',
    link: 'https://arxiv.org/abs/1810.04805'
  },
  {
    id: 't5',
    name: 'T5',
    year: '2019',
    authors: 'Raffel et al. (Google)',
    type: 'Encoder-Decoder',
    description: 'Text-to-Text Transfer Transformer. Treated every NLP problem as a text generation task.',
    impact: 'Unified NLP tasks under a single framework.',
    link: 'https://arxiv.org/abs/1910.10683'
  },
  {
    id: 'clip',
    name: 'CLIP',
    year: '2021',
    authors: 'Radford et al. (OpenAI)',
    type: 'Multimodal',
    description: 'Contrastive Language-Image Pre-training. Learned to associate images with natural language descriptions.',
    impact: 'Enabled zero-shot image classification and steered image generation (DALL-E).',
    link: 'https://arxiv.org/abs/2103.00020'
  }
];

export const INITIAL_PILLARS: Pillar[] = [
  {
    id: 'perception',
    title: 'I. Perception & Unified Models',
    subtitle: 'Perceiving, Representing, and Unifying the World',
    color: 'cyan',
    description: 'From pure vision to multimodal foundation models. How AI learns to understand diverse sensory inputs (text, image, audio) in a unified latent space.',
    topics: [
      {
        id: 'ssl',
        title: 'Self-Supervised Learning (SSL)',
        description: 'Learning representations from data itself without human labels.',
        papers: [
          {
            id: 'simclr',
            title: 'A Simple Framework for Contrastive Learning (SimCLR)',
            authors: 'Chen et al. (Google)',
            year: '2020',
            month: 'Feb',
            day: '13',
            summary: 'Simplified contrastive learning by proving that strong data augmentation is the key to learning useful representations without labels.',
            abstract: 'This paper presents SimCLR, a simple framework for contrastive learning of visual representations. We simplify recently proposed contrastive self-supervised learning algorithms without requiring specialized architectures or a memory bank. In order to learn useful representations, we show that (1) composition of data augmentations plays a critical role in defining effective predictive tasks, (2) introducing a learnable nonlinear transformation between the representation and the contrastive loss substantially improves the quality of the learned representations, and (3) contrastive learning benefits from larger batch sizes and more training steps compared to supervised learning. We demonstrate that a standard ResNet-50 trained using SimCLR achieves 76.5% top-1 accuracy on ImageNet, which is a 7% improvement over previous state-of-the-art, matching the performance of a supervised ResNet-50. When fine-tuned on only 1% of the labels, we achieve 85.8% top-5 accuracy, outperforming AlexNet with 100X fewer labels.',
            citationCount: '18,000+',
            stars: '6.2k',
            link: 'https://arxiv.org/abs/2002.05709',
            codeLink: 'https://github.com/google-research/simclr'
          },
          {
            id: 'mae',
            title: 'Masked Autoencoders Are Scalable Vision Learners (MAE)',
            authors: 'He et al. (FAIR)',
            year: '2021',
            month: 'Nov',
            day: '11',
            summary: 'Demonstrated that masking a high percentage (75%) of images and reconstructing them scales distinctively better than contrastive methods.',
            abstract: 'This paper shows that masked autoencoders (MAE) are scalable self-supervised learners for computer vision. Our MAE approach is simple: we mask random patches of the input image and reconstruct the missing pixels. Two core designs are based on this logic. First, we develop an asymmetric encoder-decoder architecture, with an encoder that operates only on the visible subset of patches (without mask tokens), and a lightweight decoder that reconstructs the original image from the latent representation and mask tokens. Second, we find that masking a high proportion of the input image, e.g., 75%, yields a nontrivial and meaningful self-supervisory task. Coupling these two designs enables us to train large models efficiently and effectively: we accelerate training (by 3x or more) and improve accuracy. Our scalable approach allows for learning high-capacity models that generalize well: e.g., a vanilla ViT-Huge model achieves the best accuracy (87.8%) among methods that use only ImageNet-1K data. Transfer performance in downstream tasks outperforms supervised pre-training and shows promising scaling behavior.',
            citationCount: '9,500+',
            stars: '8.4k',
            link: 'https://arxiv.org/abs/2111.06377',
            codeLink: 'https://github.com/facebookresearch/mae'
          },
          {
            id: 'dino',
            title: 'Emerging Properties in Self-Supervised Vision Transformers (DINO)',
            authors: 'Caron et al. (FAIR)',
            year: '2021',
            month: 'Apr',
            day: '29',
            summary: 'Showed that self-supervised ViTs automatically learn class-specific attention maps (segmentation) without supervision.',
            abstract: 'In this paper, we question whether self-supervised learning provides new properties to Vision Transformer (ViT) features that stand out compared to supervised ViT and convolutional networks. We make the following observations: (i) self-supervised ViT features contain explicit information about the semantic segmentation of an image, which does not emerge as clearly with supervised ViTs, nor with convolutional networks. (ii) these features are also excellent k-NN classifiers, reaching 78.3% top-1 on ImageNet with a small ViT-S/16. We underline the importance of momentum encoder, multi-crop training, and the use of small patches with ViTs. We implement our findings in a simple self-supervised method, called DINO, which we interpret as a form of self-distillation with no labels. We show the synergy between DINO and ViTs is key to the learned features quality.',
            citationCount: '4,000+',
            stars: '7.8k',
            link: 'https://arxiv.org/abs/2104.14294',
            codeLink: 'https://github.com/facebookresearch/dino'
          }
        ]
      },
      {
        id: 'multimodal',
        title: 'Multimodal Unification',
        description: 'Bridging the gap between Vision and Language.',
        papers: [
          {
            id: 'clip',
            title: 'Learning Transferable Visual Models From Natural Language Supervision (CLIP)',
            authors: 'Radford et al. (OpenAI)',
            year: '2021',
            month: 'Feb',
            day: '26',
            summary: 'Connected text and images via contrastive pre-training, enabling zero-shot classification on unseen datasets.',
            abstract: 'State-of-the-art computer vision systems are trained to predict a fixed set of predetermined object categories. This restricted form of supervision limits their generality and usability since additional labeled data is needed to specify any other visual concept. We demonstrate that the simple pre-training task of predicting which caption goes with which image is an efficient and scalable way to learn SOTA image representations from scratch on a dataset of 400 million (image, text) pairs collected from the internet. After pre-training, natural language is used to reference learned visual concepts (or describe new ones) enabling zero-shot transfer of the model to downstream tasks. We study the performance of this approach by benchmarking on over 30 different existing computer vision datasets, spanning tasks such as OCR, action recognition in videos, geo-localization, and fine-grained object classification. The model transfers non-trivially to most tasks and is often competitive with a fully supervised baseline without the need for any dataset specific training.',
            citationCount: '14,000+',
            stars: '14k',
            link: 'https://arxiv.org/abs/2103.00020',
            codeLink: 'https://github.com/openai/CLIP'
          }
        ]
      },
      {
        id: 'world_models',
        title: 'World Models',
        description: 'Internalizing the physics and dynamics of the environment.',
        papers: [
          {
            id: 'ijepa',
            title: 'Self-Supervised Learning from Images with a Joint-Embedding Predictive Architecture (I-JEPA)',
            authors: 'Assran et al. (Meta)',
            year: '2023',
            month: 'Jan',
            day: '19',
            summary: 'Proposed predicting latent representations of masked regions rather than pixels, moving towards abstract world modeling.',
            abstract: 'This paper proposes I-JEPA, a non-generative approach for self-supervised learning from images. The idea behind I-JEPA is to predict the representations of various target blocks in the same image from a single context block. A crucial design choice is to operate in abstract representation space (predicting embeddings) rather than pixel space, which allows the model to learn high-level semantic features rather than low-level details. Empirically, I-JEPA learns strong off-the-shelf semantic representations without the use of hand-crafted data-augmentations. We show that I-JEPA scales efficiently with model size and data size. For example, with a ViT-Huge/14 trained on ImageNet-1K, I-JEPA achieves 87.1% linear probing accuracy and 45.7% semisupervised accuracy with 1% labels, outperforming previous methods.',
            citationCount: '800+',
            stars: '3.1k',
            link: 'https://arxiv.org/abs/2301.08243',
            codeLink: 'https://github.com/facebookresearch/ijepa'
          }
        ]
      }
    ]
  },
  {
    id: 'reasoning',
    title: 'II. Intelligence & Reasoning',
    subtitle: 'Emergence, Logic, and Cognition',
    color: 'indigo',
    description: 'How intelligence emerges from statistical prediction. Covering Chain-of-Thought, planning, and handling long contexts.',
    topics: [
      {
        id: 'cot',
        title: 'Chain of Thought & Planning',
        description: 'Unlocking reasoning by asking models to "think step by step".',
        papers: [
          {
            id: 'cot_paper',
            title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
            authors: 'Wei et al. (Google)',
            year: '2022',
            month: 'Jan',
            day: '28',
            summary: 'Discovered that generating intermediate reasoning steps significantly improves performance on complex math and logic tasks.',
            abstract: 'We explore how generating a chain of thought—a series of intermediate reasoning steps—significantly improves the ability of large language models to perform complex reasoning. In particular, we show that such reasoning abilities emerge naturally in sufficiently large language models via a simple method called chain-of-thought prompting, where a few chain of thought demonstrations are provided as exemplars in prompting. Experiments on three large language models show that chain-of-thought prompting improves performance on a range of arithmetic, commonsense, and symbolic reasoning tasks. The empirical gains can be striking. For instance, prompting a PaLM 540B with just eight chain of thought exemplars achieves state-of-the-art accuracy on the GSM8K benchmark of math word problems, surpassing even finetuned GPT-3 with a code verifier.',
            citationCount: '8,000+',
            link: 'https://arxiv.org/abs/2201.11903'
          }
        ]
      },
      {
        id: 'long_context',
        title: 'Long Context & Memory',
        description: 'Handling massive information windows.',
        papers: [
          {
            id: 'rope',
            title: 'RoFormer: Enhanced Transformer with Rotary Position Embedding',
            authors: 'Su et al.',
            year: '2021',
            month: 'Apr',
            day: '20',
            summary: 'Introduced RoPE, the de-facto standard for positional encoding in modern LLMs (Llama, etc.) enabling better length extrapolation.',
            abstract: 'We investigate the problem of encoding position information in Transformer-based language models. We propose Rotary Position Embedding (RoPE), a method that encodes absolute positional information with a rotation matrix and naturally incorporates explicit relative position dependency in self-attention formulation. RoPE enables valuable properties, including flexibility of sequence length, decaying inter-token dependency with increasing relative distances, and the capability of equipping linear self-attention with relative position encoding. We verify the efficacy of RoPE on various sequence-to-sequence tasks and show that RoPE outperforms existing positional encoding methods.',
            citationCount: '4,000+',
            stars: '2.5k',
            link: 'https://arxiv.org/abs/2104.09864',
            codeLink: 'https://github.com/ZhuiyiTechnology/roformer'
          }
        ]
      }
    ]
  },
  {
    id: 'agents',
    title: 'III. Agents & Interaction',
    subtitle: 'Autonomy, Tools, and Environment',
    color: 'emerald',
    description: 'Moving from passive chat to active agents. Includes Reinforcement Learning, Tool Use, and Autonomous Frameworks.',
    topics: [
      {
        id: 'tool_use',
        title: 'Tool Use & Agents',
        description: 'LLMs utilizing external APIs and execution environments.',
        papers: [
          {
            id: 'react',
            title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
            authors: 'Yao et al. (Princeton/Google)',
            year: '2022',
            month: 'Oct',
            day: '6',
            summary: 'Interleaved reasoning traces with action execution, allowing models to dynamically correct plans and interact with APIs.',
            abstract: 'While large language models (LLMs) have demonstrated impressive capabilities across tasks in language understanding and interactive decision making, their abilities for reasoning (e.g. chain-of-thought prompting) and acting (e.g. action plan generation) have primarily been studied as separate topics. In this paper, we explore the use of LLMs to generate both reasoning traces and task-specific actions in an interleaved manner, allowing for greater synergy between the two: reasoning traces help the model induce, track, and update action plans as well as handle exceptions, while actions allow it to interface with external sources, such as knowledge bases or environments, to gather additional information. We apply our approach, ReAct, to a diverse set of language and decision making tasks and demonstrate its effectiveness over state-of-the-art baselines.',
            citationCount: '2,800+',
            stars: '4.1k',
            link: 'https://arxiv.org/abs/2210.03629',
            codeLink: 'https://github.com/ysymyth/ReAct'
          },
          {
            id: 'voyager',
            title: 'Voyager: An Open-Ended Embodied Agent with Large Language Models',
            authors: 'Wang et al. (NVIDIA)',
            year: '2023',
            month: 'May',
            day: '25',
            summary: 'First LLM-powered agent to play Minecraft continuously by writing its own code skills and maintaining a skill library.',
            abstract: 'We introduce Voyager, the first LLM-powered embodied lifelong learning agent in Minecraft that continuously explores the world, acquires diverse skills, and makes novel discoveries without human intervention. Voyager consists of three key components: 1) an automatic curriculum that maximizes exploration, 2) an ever-growing skill library of executable code for storing and retrieving complex behaviors, and 3) a new iterative prompting mechanism that incorporates environment feedback, execution errors, and self-verification for program improvement. Voyager interacts with GPT-4 via blackbox queries, which bypasses the need for model parameter fine-tuning. The skills developed by Voyager are temporally extended, interpretable, and compositional, which allows the agent\'s abilities to grow rapidly and alleviates catastrophic forgetting.',
            citationCount: '1,100+',
            stars: '5.9k',
            link: 'https://arxiv.org/abs/2305.16291',
            codeLink: 'https://github.com/MineDojo/Voyager'
          }
        ]
      }
    ]
  },
  {
    id: 'safety',
    title: 'IV. Safety & Alignment',
    subtitle: 'Trust, Robustness, and Human Values',
    color: 'rose',
    description: 'Ensuring AI systems are helpful, honest, and harmless. Techniques for control and interpreting black boxes.',
    topics: [
      {
        id: 'alignment',
        title: 'Value Alignment',
        description: 'Aligning objective functions with human intent.',
        papers: [
          {
            id: 'rlhf',
            title: 'Deep Reinforcement Learning from Human Preferences',
            authors: 'Christiano et al. (OpenAI/DeepMind)',
            year: '2017',
            month: 'Jun',
            day: '12',
            summary: 'The foundational paper for RLHF. Showed how to train agents using simple human feedback (A vs B) rather than complex reward functions.',
            abstract: 'For sophisticated reinforcement learning (RL) systems to interact usefully with real-world environments, we need to communicate complex goals to these systems. In this work, we explore goals defined in terms of (non-expert) human preferences between pairs of trajectory segments. We show that this approach can effectively solve complex RL tasks without access to the reward function, including Atari games and simulated robot locomotion. Our results show that a small amount of human feedback (less than 1%) is sufficient to solve these tasks, and that we can even learn from human feedback that is less accurate than the optimal reward function.',
            citationCount: '4,500+',
            link: 'https://arxiv.org/abs/1706.03741'
          }
        ]
      }
    ]
  },
  {
    id: 'efficiency',
    title: 'V. Efficiency & Scaling',
    subtitle: 'Faster, Smaller, Cheaper',
    color: 'amber',
    description: 'The engineering marvels behind the models. Scaling laws, optimization, and compression.',
    topics: [
      {
        id: 'scaling_laws',
        title: 'Scaling Laws',
        description: 'The physics of AI model growth.',
        papers: [
          {
            id: 'chinchilla',
            title: 'Training Compute-Optimal Large Language Models (Chinchilla)',
            authors: 'Hoffmann et al. (DeepMind)',
            year: '2022',
            month: 'Mar',
            day: '29',
            summary: 'Proved that most models were under-trained. Established the optimal ratio of model size to training tokens.',
            abstract: 'We investigate the optimal model size and number of tokens for training a transformer language model under a given compute budget. We find that for compute-optimal training, the model size and the number of training tokens should be scaled equally: for every doubling of model size the number of training tokens should also be doubled. Testing this hypothesis, we train Chinchilla, a 70B parameter model that significantly outperforms Gopher (280B), GPT-3 (175B), Jurassic-1 (178B), and Megatron-Turing NLG (530B) on a large range of downstream evaluation tasks. This also means that Chinchilla uses substantially less compute for fine-tuning and inference, greatly facilitating downstream usage.',
            citationCount: '5,000+',
            link: 'https://arxiv.org/abs/2203.15556'
          }
        ]
      },
      {
        id: 'optimization',
        title: 'Architecture Optimization',
        description: 'Hardware-aware algorithms.',
        papers: [
          {
            id: 'flashattn',
            title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness',
            authors: 'Dao et al. (Stanford)',
            year: '2022',
            month: 'May',
            day: '27',
            summary: 'Optimized GPU memory IO, speeding up attention mechanisms by 2-4x and enabling much longer context windows.',
            abstract: 'Transformers are slow and memory-hungry on long sequences, mainly because of the quadratic time and memory complexity of self-attention. We propose FlashAttention, an IO-aware exact attention algorithm that uses tiling to reduce the number of memory reads/writes between GPU HBM and on-chip SRAM. We also analyze the IO complexity of FlashAttention, showing that it requires linear number of HBM accesses w.r.t. sequence length, which is standard attention. We also extend FlashAttention to block-sparse attention, yielding an approximate attention algorithm that is faster than any existing approximate attention method.',
            citationCount: '3,200+',
            stars: '11.5k',
            link: 'https://arxiv.org/abs/2205.14135',
            codeLink: 'https://github.com/HazyResearch/flash-attention'
          }
        ]
      }
    ]
  }
];
