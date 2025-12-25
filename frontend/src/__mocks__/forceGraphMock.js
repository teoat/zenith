import React from 'react';

const ForceGraphMock = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ref,
    'data-testid': 'force-graph',
    ...props
  }, 'Force Graph');
});

export default ForceGraphMock;