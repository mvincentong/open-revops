import { getApiMode } from '@/lib/env';
import { WarRoom } from '@/components/WarRoom';

/**
 * The operator console. This is a server component so the API mode (mock vs live) is
 * resolved from the environment on the server and handed to the client orchestrator.
 */
export default function Page() {
  const apiMode = getApiMode();
  return <WarRoom apiMode={apiMode} />;
}
