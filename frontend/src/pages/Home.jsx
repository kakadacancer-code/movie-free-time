
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

import { get } from '../lib/api';
import HeroSlider from '../components/HeroSlider';

import {
  Heading,
  TitleGrid,
  Loader,
  ErrorState,
} from '../components/UI';

const reveal = {
  initial: { opacity: 0, y: 17 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

export default function Home() {
  // Fetch homepage content from Laravel
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['home'],
    queryFn: () => get('/home'),
  });

  // Fetch website settings
  const { data: site } = useQuery({
    queryKey: ['settings'],
    queryFn: () => get('/settings'),
  });

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <div className="container main-pad">
        <ErrorState error={error} retry={refetch} />
      </div>
    );
  }

  // Featured + trending titles for hero slider
  const slides = [
    data?.featured,
    ...(data?.trending || []),
  ]
    .filter(Boolean)
    .filter(
      (title, index, array) =>
        array.findIndex((item) => item.id === title.id) === index
    )
    .slice(0, 6);

  return (
    <>
      {/* HERO SLIDER */}
      <HeroSlider items={slides} />

      {/* TRENDING */}
      <motion.section
        {...reveal}
        className="container home-section"
      >
        <Heading
          eyebrow="01 / TRENDING"
          title="Trending Right Now"
          subtitle="Discover what everyone is watching."
          link="/discover"
          linkText="Explore All"
        />

        <TitleGrid items={data?.trending || []} />
      </motion.section>

      {/* POPULAR MOVIES */}
      <motion.section
        {...reveal}
        className="container home-section"
      >
        <Heading
          eyebrow="02 / MOVIES"
          title="Explore Movies"
          subtitle="Find your next favorite movie."
          link="/movies"
          linkText="All Movies"
        />

        <TitleGrid items={data?.movies || []} />
      </motion.section>

      {/* POPULAR ANIME */}
      <motion.section
        {...reveal}
        className="container home-section"
      >
        <Heading
          eyebrow="03 / ANIME"
          title="Discover Anime"
          subtitle="Explore amazing anime stories."
          link="/anime"
          linkText="All Anime"
        />

        <TitleGrid items={data?.anime || []} />
      </motion.section>

      {/* TOP RATED */}
      <motion.section
        {...reveal}
        className="container home-section"
      >
        <Heading
          eyebrow="04 / TOP RATED"
          title="Highest Rated"
          subtitle="Top-rated movies and anime."
          link="/discover"
        />

        <TitleGrid items={data?.top_rated || []} />
      </motion.section>

      {/* GENRES */}
      <motion.section
        {...reveal}
        className="container home-section"
      >
        <Heading
          eyebrow="05 / CATEGORIES"
          title="Explore by Genre"
          subtitle="Find something that matches your mood."
          link="/discover"
          linkText="All Genres"
        />

        <div className="genres-grid">
          {(data?.genres || []).slice(0, 8).map((genre, index) => (
            <Link
              key={genre.id}
              to={`/discover?genre=${genre.slug}`}
              className={`genre-tile genre-${index % 5}`}
            >
              <span className="genre-symbol">✦</span>

              <span>
                <b>{genre.name}</b>
                <small>{genre.titles_count || 0} titles</small>
              </span>

              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ARTICLES */}
      <motion.section
        {...reveal}
        className="container home-section"
      >
        <Heading
          eyebrow="06 / ARTICLES"
          title="Latest News & Articles"
          subtitle="Entertainment news and stories."
          link="/articles"
          linkText="View Articles"
        />

        <div className="home-articles">
          {(data?.articles || []).map((article, index) => (
            <Link
              key={article.id}
              to={`/articles/${article.slug}`}
              className={`home-article article-tone-${index % 3}`}
            >
              <div className="article-art">
                <span>MovieFreeTime EDITORIAL</span>
              </div>

              <div className="article-details">
                <span className="eyebrow">
                  {article.category?.name || 'Article'}
                </span>

                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>

                <span className="text-link">
                  Read Article <ArrowUpRight size={17} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* JOIN COMMUNITY */}
      <section className="container final-cta">
        <div>
          <span className="eyebrow">
            {site?.site_name || 'MovieFreeTime'} COMMUNITY
          </span>

          <h2>Your Watchlist. Your Story.</h2>

          <p>
            Save your favorite movies, discover anime,
            and share your reviews.
          </p>
        </div>

        <Link
          to="/register"
          className="btn btn-primary btn-large"
        >
          Join MovieFreeTime <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
