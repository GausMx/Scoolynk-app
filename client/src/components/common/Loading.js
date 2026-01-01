import React from 'react';
const Loading = ({ percentage }) => {
  return (
    <div className="loading-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh'
    }}>
      <img 
        src='/logo192.png' 
        alt="Scoolynk Logo" 
        style={{ width: 150, marginBottom: 20 }}
      />
      <div style={{ fontSize: 18, fontWeight: 'bold' }}>
        Loading... {percentage}%
      </div>
    </div>
  );
};

export default Loading;