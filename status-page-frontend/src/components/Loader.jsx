import './Loader.css';

const Loader = ({ loaderText = "Loading..." }) => {
    return (
        <div className="overlay">
            <div className="custom-loader-wrapper">
                <div className="custom-loader">
                    <div className="circle"></div>
                    <div className="circle"></div>
                    <div className="circle"></div>
                    <div className="circle"></div>
                </div>
                <p className="loading-text">{loaderText}</p>
            </div>
        </div>
    );
};

export default Loader;