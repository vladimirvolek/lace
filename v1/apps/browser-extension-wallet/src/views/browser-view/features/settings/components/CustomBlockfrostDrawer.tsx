import React, { ReactElement, useEffect, useState } from 'react';
import { Drawer, DrawerHeader, DrawerNavigation, logger, PostHogAction, toast } from '@lace/common';
import { Typography } from 'antd';
import styles from './SettingsLayout.module.scss';
import { useTranslation } from 'react-i18next';
import { Button, TextBox } from '@input-output-hk/lace-ui-toolkit';
import { getBackgroundStorage } from '@lib/scripts/background/storage';
import { useCustomBlockfrostApi, useWalletManager } from '@hooks';
import { useWalletStore } from '@stores';
import { isValidURL } from '@utils/is-valid-url';
import { useAnalyticsContext } from '@providers';
import SwitchIcon from '@assets/icons/switch.component.svg';
import ErrorIcon from '@assets/icons/address-error-icon.component.svg';
import PlayIcon from '@assets/icons/play-icon.component.svg';
import PauseIcon from '@assets/icons/pause-icon.component.svg';
import { config } from '@src/config';

const { Text } = Typography;

interface CustomBlockfrostDrawerProps {
  visible: boolean;
  onClose: () => void;
  popupView?: boolean;
}

export const CustomBlockfrostDrawer = ({
  visible,
  onClose,
  popupView = false
}: CustomBlockfrostDrawerProps): ReactElement => {
  const { t } = useTranslation();
  const { enableCustomBlockfrost } = useWalletManager();
  const { environmentName } = useWalletStore();
  const analytics = useAnalyticsContext();
  const { BLOCKFROST_CONFIGS } = config();

  const defaultConfig = BLOCKFROST_CONFIGS[environmentName];

  const [baseUrl, setBaseUrl] = useState<string>(defaultConfig?.baseUrl || '');
  const [projectId, setProjectId] = useState<string>(defaultConfig?.projectId || '');
  const [isValidationError, setIsValidationError] = useState<boolean>(false);
  const { getCustomBlockfrostForNetwork } = useCustomBlockfrostApi();

  const isCustomBlockfrostEnabledForCurrentNetwork = getCustomBlockfrostForNetwork(environmentName).status;

  useEffect(() => {
    getBackgroundStorage()
      .then((storage) => {
        setBaseUrl(storage.customBlockfrostBaseUrl || defaultConfig?.baseUrl || '');
        setProjectId(storage.customBlockfrostProjectId || defaultConfig?.projectId || '');
      })
      .catch(logger.error);
  }, [defaultConfig?.baseUrl, defaultConfig?.projectId]);

  const handleCustomBlockfrost = async (enable: boolean) => {
    if (enable) {
      if (!isValidURL(baseUrl) || !projectId.trim()) {
        setIsValidationError(true);
        return;
      }
    }

    setIsValidationError(false);
    try {
      await enableCustomBlockfrost(
        environmentName,
        enable ? projectId.trim() : undefined,
        enable ? baseUrl.trim() : undefined
      );
      toast.notify({
        text: enable
          ? t('browserView.settings.wallet.customBlockfrost.usingCustomBlockfrost')
          : t('browserView.settings.wallet.customBlockfrost.usingDefaultBlockfrost'),
        withProgressBar: true,
        icon: SwitchIcon
      });
      if (enable) {
        void analytics.sendEventToPostHog(PostHogAction.SettingsCustomBlockfrostEnableClick);
      }
    } catch (error) {
      logger.error('Error switching Blockfrost config', error);
      toast.notify({ text: t('general.errors.somethingWentWrong'), icon: ErrorIcon });
    }
  };

  return (
    <Drawer
      open={visible}
      onClose={onClose}
      title={
        <DrawerHeader popupView={popupView} title={t('browserView.settings.wallet.customBlockfrost.title')} />
      }
      navigation={
        <DrawerNavigation
          title={t('browserView.settings.heading')}
          onCloseIconClick={!popupView ? onClose : undefined}
          onArrowIconClick={popupView ? onClose : undefined}
        />
      }
      popupView={popupView}
    >
      <div className={popupView ? styles.popupContainer : undefined}>
        <Text className={styles.drawerDescription} data-testid="custom-blockfrost-description">
          {t('browserView.settings.wallet.customBlockfrost.description')}
        </Text>
        <div className={styles.customApiContainer}>
          <TextBox
            label={t('browserView.settings.wallet.customBlockfrost.baseUrlLabel')}
            w="$fill"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            disabled={isCustomBlockfrostEnabledForCurrentNetwork}
            data-testid="custom-blockfrost-base-url"
          />
        </div>
        <div className={styles.customApiContainer}>
          <TextBox
            label={t('browserView.settings.wallet.customBlockfrost.projectIdLabel')}
            w="$fill"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            disabled={isCustomBlockfrostEnabledForCurrentNetwork}
            data-testid="custom-blockfrost-project-id"
          />
          <Button.Primary
            label={
              isCustomBlockfrostEnabledForCurrentNetwork
                ? t('browserView.settings.wallet.customBlockfrost.disable')
                : t('browserView.settings.wallet.customBlockfrost.enable')
            }
            icon={isCustomBlockfrostEnabledForCurrentNetwork ? <PauseIcon /> : <PlayIcon />}
            onClick={() => handleCustomBlockfrost(!isCustomBlockfrostEnabledForCurrentNetwork)}
            data-testid={`custom-blockfrost-button-${isCustomBlockfrostEnabledForCurrentNetwork ? 'disable' : 'enable'}`}
          />
        </div>
        {isValidationError && (
          <Text className={styles.validationError} data-testid="custom-blockfrost-validation-error">
            {t('browserView.settings.wallet.customBlockfrost.validationError')}
          </Text>
        )}
      </div>
    </Drawer>
  );
};
