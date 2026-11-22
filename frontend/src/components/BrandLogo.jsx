import playIcon from '../assets/movie-play.svg';

// The repeated capitals share the same outlines at every size.
const letterM = 'M0 28V4h5.5l5 10.7L15.6 4H21v24h-5.1V13.3l-5.4 10.5-5.4-10.5V28z';
const letterE = 'M0 4h15.8l-1.3 4.6H5.2v5.1h8.6v4.4H5.2v5.3h10.5L14.4 28H0z';

export default function BrandLogo() {
  return (
    <svg className="brand-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 253 32"
      width="190" height="24" role="img" aria-label="MovieFreeTime" focusable="false">
      <g fill="currentColor" transform="translate(4 0) skewX(-8)">
        <path d={letterM} />
        <path d="M53 4h5.7l3.7 17.2L66.4 4h5.5l-6.8 24h-5.8z" />
        <path d="M74 4h5.2v24H74z" />
        <path d={letterE} transform="translate(83)" />
        <path d="M104 4h15.5l-1.3 4.6h-9v5.7h8v4.5h-8V28H104z" />
        <path fillRule="evenodd" d="M122 4h9.1c5.7 0 8.8 2.6 8.8 7.7 0 3.6-1.6 6-4.5 7.1l5.1 9.2h-5.8l-4.4-8.4h-3.1V28H122zm5.2 4.5v6.7h3.7c2.5 0 3.8-1 3.8-3.4s-1.3-3.3-3.8-3.3z" />
        <path d={letterE} transform="translate(143)" />
        <path d={letterE} transform="translate(161.5)" />
        <path d="M179.5 4h18.2l-1.3 4.7h-5.8V28h-5.2V8.7h-5.9z" />
        <path d="M199.5 4h5.2v24h-5.2z" />
        <path d={letterM} transform="translate(208.5)" />
        <path d={letterE} transform="translate(233)" />
      </g>
      <image href={playIcon} x="24" width="32" height="32" />
    </svg>
  );
}
