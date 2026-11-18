import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('RIGLOCK Starting...');

  useEffect(() => {
    setText('RIGLOCK Loading...');
  }, []);

  useEffect(() => {
    setText('RIGLOCK Ready');
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>{text}</h1>
    </div>
  );
}