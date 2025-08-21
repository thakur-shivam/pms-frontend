export interface Meeting {
    id: string; 
    project_id: string;
    date: string; 
    attendees: string[];
    notes: string;
    created_by?: string;
  }