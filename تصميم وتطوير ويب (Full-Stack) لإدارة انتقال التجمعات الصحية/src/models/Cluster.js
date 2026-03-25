const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cluster = sequelize.define('Cluster', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  region: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  governorate: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contactPerson: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  contactPhone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'clusters',
  timestamps: true,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['region'] },
    { fields: ['status'] }
  ]
});

module.exports = Cluster;