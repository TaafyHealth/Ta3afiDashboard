import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faUserDoctor, faLanguage, faVenusMars } from '@fortawesome/free-solid-svg-icons';
import { Badge } from './index';
import './DoctorCard.css';

const DoctorCard = ({
  doctor,
  verified = false,
  onClick,
  className = '',
  ...props
}) => {
  const navigate = useNavigate();
  const imageRef = useRef(null);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(doctor);
    } else {
      navigate(`/doctors/info/${doctor.id}`);
    }
  };

  // Reset image error state when doctor changes
  useEffect(() => {
    setImageError(false);
  }, [doctor.id, doctor.profileImage]);

  // Prevent hb-hide-temp class from being added/removed repeatedly
  useEffect(() => {
    if (imageRef.current && !imageError) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (imageRef.current && imageRef.current.classList.contains('hb-hide-temp')) {
              imageRef.current.classList.remove('hb-hide-temp');
            }
          }
        });
      });

      observer.observe(imageRef.current, {
        attributes: true,
        attributeFilter: ['class']
      });

      // Also check and remove immediately
      const checkAndRemove = () => {
        if (imageRef.current && imageRef.current.classList.contains('hb-hide-temp')) {
          imageRef.current.classList.remove('hb-hide-temp');
        }
      };

      // Check periodically to catch any additions
      const interval = setInterval(checkAndRemove, 100);

      return () => {
        observer.disconnect();
        clearInterval(interval);
      };
    }
  }, [doctor.id, imageError]);

  const cardClasses = [
    'doctor-card',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      {...props}
    >
      {/* Status Badge */}
      <div className="doctor-card-badge">
        <Badge
          variant={verified ? 'success' : 'warning'}
          size="sm"
          rounded
        >
          {verified ? 'Verified' : 'Pending'}
        </Badge>
      </div>

      {/* Doctor Image */}
      <div className="doctor-card-image">
        {imageError || !doctor.profileImage ? (
          <div className="doctor-card-image-placeholder" />
        ) : (
          <img
            ref={imageRef}
            src={doctor.profileImage}
            alt={doctor.name}
            onError={(e) => {
              setImageError(true);
              // Remove hb-hide-temp if it gets added
              if (e.target.classList.contains('hb-hide-temp')) {
                e.target.classList.remove('hb-hide-temp');
              }
            }}
            onLoad={(e) => {
              // Remove hb-hide-temp if it gets added
              if (e.target.classList.contains('hb-hide-temp')) {
                e.target.classList.remove('hb-hide-temp');
              }
            }}
          />
        )}
        {doctor.starRate && (
          <div className="doctor-card-rating">
            <FontAwesomeIcon icon={faStar} />
            <span>{doctor.starRate.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Doctor Info */}
      <div className="doctor-card-content">
        <h3 className="doctor-card-name">{doctor.name}</h3>
        {doctor.title && (
          <p className="doctor-card-title">{doctor.title}</p>
        )}
        {doctor.description && (
          <p className="doctor-card-description">
            {doctor.description.length > 100
              ? `${doctor.description.substring(0, 100)}...`
              : doctor.description}
          </p>
        )}
      </div>

      {/* Doctor Stats */}
      <div className="doctor-card-stats">
        {doctor.gender && (
          <div className="doctor-stat">
            <FontAwesomeIcon icon={faVenusMars} className="stat-icon" />
            <span className="stat-label">{doctor.gender}</span>
          </div>
        )}
        {doctor.language && (
          <div className="doctor-stat">
            <FontAwesomeIcon icon={faLanguage} className="stat-icon" />
            <span className="stat-label">{doctor.language}</span>
          </div>
        )}
        {doctor.completedSessions !== undefined && (
          <div className="doctor-stat">
            <FontAwesomeIcon icon={faUserDoctor} className="stat-icon" />
            <span className="stat-label">{doctor.completedSessions} Sessions</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorCard;
