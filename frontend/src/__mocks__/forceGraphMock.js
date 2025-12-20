const React = require('react');

module.exports = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ref,
    'data-testid': 'force-graph',
    ...props
  }, 'Force Graph');
});