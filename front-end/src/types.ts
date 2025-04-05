export type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  unique_key?: string;
  provider?: string;
  logo?: string;
};

export type HubSpotContact = {
  id: string;
  properties: {
    email: string;
    firstname: string | null;
    lastname: string | null;
    company: string | null;
    phone: string | null;
  };
};

export type HubSpotTask = {
  id: string;
  properties: {
    hs_task_subject: string;
    hs_task_body: string;
    hs_task_status: string;
    hs_task_priority: string;
    hs_timestamp: string;
  };
};
