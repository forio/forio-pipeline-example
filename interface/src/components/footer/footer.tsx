import './footer.scss';
import { Lang } from '../lang';
import { config } from 'epicenter-libs';

export const Footer = () => {
  const forioLink = `https://forio.com/simulation_entrance?utm_source=${config.accountShortName}&utm_medium=footer&utm_campaign=app-${config.accountShortName}-${config.projectShortName}`;

  return (
    <footer>
      <span>
        <Lang>copyright</Lang>
      </span>
      <span>
        <a className="forio-link" href={forioLink} target="_blank" rel="noreferrer">
          <Lang>forio_link</Lang>
        </a>
      </span>
    </footer>
  );
};
