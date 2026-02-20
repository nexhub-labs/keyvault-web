import { HeroTilted } from '../../utils/data';
import './TiltedScroll.css';

const TiltedScroll = ({ items }: { items: HeroTilted[]; }) => {
  return (
    <div className="container">
      <div className="inner-container">
        <div className="scroll-grid">
          {items.map((item, index) => (
            <div key={index} className="grid-item">
              <img src={item.icon} className='icon rounded-full w-16' />
              <div>
                <h3 className="item-title text-md text-green-400">{item.title}</h3>
                <p className="item-text text-xs">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TiltedScroll;