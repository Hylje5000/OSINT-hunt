import React from 'react';

const ItemCard = ({ item }) => {
  return (
    <div className="item-card">
      <h3>{item.name}</h3>
      <p>{item.description}</p>
    </div>
  );
};

export default ItemCard;