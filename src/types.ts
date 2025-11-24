
export enum View {
  HOME = 'HOME',
  PILLAR_DETAIL = 'PILLAR_DETAIL',
  RESEARCH = 'RESEARCH',
  TUTOR = 'TUTOR',
  DAILY = 'DAILY'
}

export interface Comment {
  id: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  year: string;
  month?: string;
  day?: string; 
  summary: string; // Short description (Always visible)
  abstract?: string; // Long description (Toggleable)
  citationCount?: string;
  stars?: string | number; // GitHub Stars (Updated to allow numbers)
  upvotes?: number; // Hugging Face Upvotes
  link: string;
  codeLink?: string;
  isNew?: boolean;
  comments?: Comment[];
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  papers: Paper[];
}

export interface Pillar {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  description: string;
  topics: Topic[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  groundingSources?: Array<{
    title: string;
    uri: string;
  }>;
}

export interface TimelineEvent {
  id: string;
  year: string;
  fullDate?: string;
  title: string;
  description: string;
  category: string;
  authors?: string;
  impact?: string;
  link?: string;
}

export interface ModelCardData {
  id: string;
  name: string;
  year: string;
  authors: string;
  type: string;
  description: string;
  impact: string;
  link: string;
}

// --- File System Access API Types ---

export interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(options?: any): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: any): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
  close(): Promise<void>;
}
