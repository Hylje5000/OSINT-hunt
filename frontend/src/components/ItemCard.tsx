import React from 'react';

interface Item {
  name: string;
  description: string;
}

interface ItemCardProps {
  item: Item;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  return (
    <div className="item-card">
      <h3>{item.name}</h3>
      <p>{item.description}</p>
    </div>
  );
};

export default ItemCard;