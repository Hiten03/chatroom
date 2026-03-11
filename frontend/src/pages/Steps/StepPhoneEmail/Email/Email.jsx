import React, { useState, useCallback } from 'react';
import Card from '../../../../components/shared/Card/Card';
import Button from '../../../../components/shared/Button/Button';
import TextInput from '../../../../components/shared/TextInput/TextInput';
import styles from '../StepPhoneEmail.module.css';

const Email = ({ onNext }) => {
  const [email, setEmail] = useState('');
  const isValidEmail = /\S+@\S+\.\S+/.test(email);

  const handleChange = useCallback((e) => {
    setEmail(e.target.value);
  }, []);

  const handleNext = useCallback(() => {
    if (isValidEmail) {
      onNext();
    } else {
      alert('Please enter a valid email address');
    }
  }, [onNext, isValidEmail]);

  return (
    <Card title="Enter your email id" icon="email-emoji">
      <TextInput
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={handleChange}
      />
      <div>
        <div className={styles.actionButtonWrap}>
          <Button text="Next" onClick={handleNext} disabled={!isValidEmail} />
        </div>
        <p className={styles.bottomParagraph}>
          By entering your email, you’re agreeing to our Terms of
          Service and Privacy Policy. Thanks!
        </p>
      </div>
    </Card>
  );
};

export default Email;
