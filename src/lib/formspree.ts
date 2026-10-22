const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mgaogpyl';

export type FormType =
  | 'organization_profile'
  | 'opportunity'
  | 'incorrect_info_report'
  | string;

export interface FormspreeData {
  [key: string]: any;
}

/**
 * Sends a copy of form submissions to Formspree without blocking or failing the main application flow.
 * If Formspree fails or the user is offline, the failure is logged to the console only.
 */
export async function sendToFormspree(
  formType: FormType,
  data: FormspreeData,
  customSubject?: string
): Promise<void> {
  // Validate that submission is not empty
  if (!data || Object.keys(data).length === 0) {
    console.warn('Formspree: Empty submission ignored.');
    return;
  }

  // Honeypot check: If _gotcha is filled, it is a bot spam submission
  if (data._gotcha && String(data._gotcha).trim().length > 0) {
    console.warn('Formspree: Honeypot field triggered, submission aborted.');
    return;
  }

  try {
    // Generate formatted payload
    const formattedData: Record<string, any> = {
      formType,
      appName: 'Center for Centers',
      submittedAt: new Date().toISOString(),
    };

    // Determine descriptive email subject
    let subject = customSubject;
    if (!subject) {
      if (formType === 'organization_profile') {
        const orgName = data.name || data.orgName || 'Unnamed Center';
        subject = `Center for Centers: Organization profile - ${orgName}`;
      } else if (formType === 'opportunity') {
        const title = data.title || 'Untitled Opportunity';
        const org = data.orgName ? ` (${data.orgName})` : '';
        subject = `Center for Centers: Opportunity submitted - ${title}${org}`;
      } else if (formType === 'incorrect_info_report') {
        const target = data.targetTitle || data.targetId || 'Listing';
        subject = `Center for Centers: Issue report on - ${target}`;
      } else {
        subject = `Center for Centers: ${formType} submitted`;
      }
    }
    formattedData._subject = subject;

    // Process fields:
    // - Convert arrays to comma-separated text so they display cleanly in Formspree dashboard & notification emails
    // - Filter out any security-sensitive fields (passwords, tokens, auth state)
    // - Filter out the honeypot field itself
    for (const [key, value] of Object.entries(data)) {
      if (key === '_gotcha' || key === 'gotcha') continue;
      if (key === 'auth' || key === 'token' || key === 'password' || key === 'credential') continue;

      if (Array.isArray(value)) {
        formattedData[key] = value.join(', ');
      } else if (value !== undefined && value !== null) {
        formattedData[key] = value;
      }
    }

    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn('Formspree non-200 response (non-blocking):', response.status, errText);
    }
  } catch (error) {
    // Never throw or alert to user; log failure to console only
    console.warn('Formspree submission error (non-blocking):', error);
  }
}
