import React from 'react';
import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    
    function startRegister() {
        navigate('/authenticate');
    }
    
    return (
        <div className={styles.heroWrapper}>
            {/* Animated Background Orbs */}
            <div className={styles.orbShape1}></div>
            <div className={styles.orbShape2}></div>
            
            <div className={styles.heroContent}>
                <h1 className={styles.heading}>Connect instantly.<br/>Chat seamlessly.</h1>
                <p className={styles.text}>
                    We’re working hard to get ChatRoom ready for everyone!
                    While we wrap up the finishing touches, we’re adding people
                    gradually to make sure nothing breaks.
                </p>
                
                <div className={styles.ctaWrapper}>
                    <button onClick={startRegister} className={styles.ctaButton}>
                        Get Started
                    </button>
                    
                    <div className={styles.signinWrapper}>
                        <span>Have an invite text? </span>
                        <span className={styles.hasInvite} onClick={startRegister}>
                            Sign In
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;