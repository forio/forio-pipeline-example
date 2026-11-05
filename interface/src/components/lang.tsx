import { FC } from 'react';
import { useTranslation } from 'react-i18next';

export type LangProps = {
  children: string;
  ns?: string;
  d?: Record<string, string | number>;
  kp?: string;
};

export const Lang: FC<LangProps> = ({
  children,
  ns: namespace,
  d: dict,
  kp: keyPrefix,
}) => {
  const { t } = useTranslation(namespace, { keyPrefix });
  return t(children, dict) as string;
};
