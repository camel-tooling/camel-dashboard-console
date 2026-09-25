import CamelImage from '@images/camel.svg';
import { ComponentType } from 'react';

export const CamelIcon: ComponentType = () => {
  return <img src={CamelImage} alt="Camel" width="50px" height="50px" />;
};

export const CamelIconAlert: ComponentType = () => {
  return <img src={CamelImage} alt="Camel" width="17.5px" height="17.5px" />;
};
