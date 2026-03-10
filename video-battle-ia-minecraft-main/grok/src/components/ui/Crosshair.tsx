const Crosshair = () => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      width: '4px',
      height: '4px',
      backgroundColor: 'white',
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 1000
    }} />
  )
}

export default Crosshair