export interface Task {
  id: string;
  name: string;
  project_id: string;
  status_id: string;
  priority_id: string;
  due_date: string;
  project_name?: string;
  status_name?: string;
  priority_name?: string;
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  task_name: string;
  user_name: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
}
