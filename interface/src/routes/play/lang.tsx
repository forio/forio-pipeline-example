import { FC } from 'react';
import { Lang as GenericLang, LangProps } from '~/components/lang';

export const Lang: FC<LangProps> = (props) => <GenericLang {...props} ns="play" />;
