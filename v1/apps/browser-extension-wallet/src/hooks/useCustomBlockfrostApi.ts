import { useLocalStorage } from '@hooks/useLocalStorage';
import { EnvironmentTypes } from '@stores';
import { CustomBlockfrostConfig } from '@types';

interface UseCustomBlockfrostApiReturn {
  getCustomBlockfrostForNetwork: (network: EnvironmentTypes) => CustomBlockfrostConfig;
  updateCustomBlockfrost: (network: EnvironmentTypes, data: CustomBlockfrostConfig) => void;
}

export const useCustomBlockfrostApi = (): UseCustomBlockfrostApiReturn => {
  const [customBlockfrostConfig, { updateLocalStorage: updateCustomBlockfrostConfig }] =
    useLocalStorage('customBlockfrostConfig');

  const getCustomBlockfrostForNetwork = (network: EnvironmentTypes) => {
    const networkConfig = customBlockfrostConfig?.[network];
    const status = networkConfig?.status || false;
    const projectId = networkConfig?.projectId || '';
    const baseUrl = networkConfig?.baseUrl || '';
    return { status, projectId, baseUrl };
  };

  const updateCustomBlockfrost = (network: EnvironmentTypes, data: CustomBlockfrostConfig) => {
    updateCustomBlockfrostConfig({ ...customBlockfrostConfig, [network]: data });
  };

  return { getCustomBlockfrostForNetwork, updateCustomBlockfrost };
};
