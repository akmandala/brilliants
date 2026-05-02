import { v4 as uuid } from 'uuid';
import type { Chat, Message, ParserInput, ParserResult, Project, Workspace } from '../types';

const KEY = 'component-parser-workspace-v1';

const now = () => new Date().toISOString();

export const createDefaultWorkspace = (): Workspace => {
  const projectId = uuid();
  const chatId = uuid();
  const project: Project = { id: projectId, name: 'Default Project', createdAt: now(), updatedAt: now(), chatIds: [chatId] };
  const chat: Chat = { id: chatId, projectId, name: 'Chat 1', createdAt: now(), updatedAt: now(), messages: [] };
  return {
    projects: { [projectId]: project },
    chats: { [chatId]: chat },
    selectedProjectId: projectId,
    selectedChatId: chatId,
    version: 1
  };
};

export const loadWorkspace = (): Workspace => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createDefaultWorkspace();
    return JSON.parse(raw) as Workspace;
  } catch {
    return createDefaultWorkspace();
  }
};

export const saveWorkspace = (workspace: Workspace): void => {
  localStorage.setItem(KEY, JSON.stringify(workspace));
};

export const exportWorkspace = (workspace: Workspace): string => JSON.stringify(workspace, null, 2);

export const importWorkspace = (json: string): Workspace => {
  const parsed = JSON.parse(json) as Workspace;
  if (!parsed.projects || !parsed.chats) throw new Error('Invalid workspace JSON');
  return parsed;
};

export const addProject = (workspace: Workspace, name = 'New Project'): Workspace => {
  const id = uuid();
  const chatId = uuid();
  workspace.projects[id] = { id, name, createdAt: now(), updatedAt: now(), chatIds: [chatId] };
  workspace.chats[chatId] = { id: chatId, projectId: id, name: 'Chat 1', createdAt: now(), updatedAt: now(), messages: [] };
  workspace.selectedProjectId = id;
  workspace.selectedChatId = chatId;
  return { ...workspace };
};

export const addChat = (workspace: Workspace, projectId: string, name = 'New Chat'): Workspace => {
  const id = uuid();
  const project = workspace.projects[projectId];
  if (!project) return workspace;
  workspace.chats[id] = { id, projectId, name, createdAt: now(), updatedAt: now(), messages: [] };
  project.chatIds.push(id);
  project.updatedAt = now();
  workspace.selectedChatId = id;
  return { ...workspace };
};

export const upsertMessage = (
  workspace: Workspace,
  chatId: string,
  msg: { role: Message['role']; input?: ParserInput; result?: ParserResult; text?: string }
): Workspace => {
  const chat = workspace.chats[chatId];
  if (!chat) return workspace;
  const message: Message = { id: uuid(), role: msg.role, createdAt: now(), input: msg.input, result: msg.result, text: msg.text };
  chat.messages.push(message);
  chat.updatedAt = now();
  return { ...workspace };
};
