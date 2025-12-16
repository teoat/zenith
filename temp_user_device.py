
class UserDevice(Base):
    __tablename__ = 'user_devices'

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), index=True)
    device_name = Column(String)
    device_type = Column(String)
    ip_address = Column(String)
    last_login = Column(DateTime, default=utc_now)
    is_trusted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", backref="devices")
