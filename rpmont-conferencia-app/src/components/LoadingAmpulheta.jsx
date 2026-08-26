import { GiSandsOfTime } from 'react-icons/gi';

function LoadingAmpulheta({
  texto = 'Carregando...',
}) {
  return (
    <div className="loading-ampulheta-overlay">
      <div className="loading-ampulheta-card">
        <GiSandsOfTime className="loading-ampulheta-icone" />

        <p className="loading-ampulheta-texto">
          {texto}
        </p>
      </div>
    </div>
  );
}

export default LoadingAmpulheta;