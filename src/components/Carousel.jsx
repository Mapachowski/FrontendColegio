import React, { useState, useEffect } from 'react';
import "../assets/styles/Carousel.css";
import img1 from "../assets/images/images1.jpg";
import img2 from "../assets/images/images2.jpg";
import img3 from "../assets/images/images3.jpg";

const images = [img1, img2, img3];

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="carousel-container">
      <img src={images[currentIndex]} alt="Colegio" className="carousel-image" />
      <div className="carousel-text">
        <h2>Cada día es una nueva oportunidad</h2>
        <p>Educando con excelencia</p>
      </div>
    </div>
  );
};

export default Carousel;