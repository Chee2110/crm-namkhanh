import { useState, useEffect } from 'react';
import { subscribeNetworkActivity, getNetworkActivityState, NetworkActivityState } from '../services/api';

export function useApiLoading(): NetworkActivityState {
  const [state, setState] = useState<NetworkActivityState>(getNetworkActivityState);

  useEffect(() => {
    return subscribeNetworkActivity(setState);
  }, []);

  return state;
}
