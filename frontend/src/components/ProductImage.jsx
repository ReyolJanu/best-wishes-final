"use client";

import Image from 'next/image';
import styles from './ProductImage.module.css';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Responsive product image:
 * - Not cropped (object-fit: contain)
 * - Keeps real aspect ratio (auto by default)
 * - Fits container without distorting
 * - Fixed max size on large screens, scales on mobile
 */
export default function ProductImage({ src, alt, aspect = 'auto' }) {
  const [ratio, setRatio] = React.useState(aspect === 'auto' ? null : aspect);

  const onComplete = (img) => {
    if (aspect === 'auto' && img?.naturalWidth && img?.naturalHeight) {
      setRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
    }
  };

  return (
    <div className={styles.container} style={{ aspectRatio: ratio || '1 / 1' }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, 640px"
        className={styles.image}
        priority
        onLoadingComplete={onComplete}
      />
    </div>
  );
}

ProductImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  aspect: PropTypes.string,
};

